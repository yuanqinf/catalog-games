/**
 * Unified Steam Integration Service
 * Centralizes all Steam-related data fetching with caching, retry logic, and error handling
 */

import * as cheerio from 'cheerio';
import { findBestSteamMatch } from './find-best-steam-match';

// Steam API Configuration
const STEAM_CONFIG = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    Cookie:
      'birthtime=946684800; lastagecheckage=1-January-2000; mature_content=1',
  },
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

// Data Types
export interface SteamAppInfo {
  steamAppId: number;
  steamName: string;
}

export interface SteamReviewData {
  steam_all_review: string | null;
  steam_recent_review: string | null;
}

export interface SteamTagsData {
  steam_popular_tags: string[] | null;
}

export interface SteamMetadata {
  steam_price: string | null;
  steam_discount: string | null;
  steam_release_date: string | null;
}

export interface CompleteSteamData
  extends SteamAppInfo,
    SteamReviewData,
    SteamTagsData,
    SteamMetadata {}

export interface SteamIntegrationResult {
  success: boolean;
  data: Partial<CompleteSteamData>;
  error?: string;
}

// Simple in-memory cache (could be replaced with Redis in production)
class SteamCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

export class SteamIntegrationService {
  private static cache = new SteamCache();

  /**
   * Enhanced fetch with retry logic and timeout
   */
  private static async fetchWithRetry(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= STEAM_CONFIG.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          STEAM_CONFIG.timeout,
        );

        const response = await fetch(url, {
          ...options,
          headers: {
            ...STEAM_CONFIG.headers,
            ...options.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return response;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `Steam fetch attempt ${attempt}/${STEAM_CONFIG.retryAttempts} failed:`,
          lastError.message,
        );

        if (attempt < STEAM_CONFIG.retryAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, STEAM_CONFIG.retryDelay * attempt),
          );
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Fetch and parse Steam store page HTML
   */
  private static async fetchStorePage(
    steamAppId: number,
  ): Promise<cheerio.CheerioAPI | null> {
    const cacheKey = `store_page_${steamAppId}`;
    const cached = this.cache.get<cheerio.CheerioAPI>(cacheKey);
    if (cached) return cached;

    try {
      const storeUrl = `https://store.steampowered.com/app/${steamAppId}`;
      const response = await this.fetchWithRetry(storeUrl);
      const html = await response.text();

      // Check if the page is valid (not an error page)
      if (html.includes('error') && html.includes('not available')) {
        console.warn(`Steam app ${steamAppId} not available`);
        return null;
      }

      const $ = cheerio.load(html);
      this.cache.set(cacheKey, $);
      return $;
    } catch (error) {
      console.error(
        `Failed to fetch Steam store page for ${steamAppId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Find Steam app by game name
   */
  static async findSteamApp(gameName: string): Promise<SteamAppInfo | null> {
    const cacheKey = `steam_app_${gameName.toLowerCase()}`;
    const cached = this.cache.get<SteamAppInfo>(cacheKey);
    if (cached) return cached;

    try {
      const steamMatch = await findBestSteamMatch(gameName);
      if (!steamMatch) return null;

      const appInfo: SteamAppInfo = {
        steamAppId: steamMatch.steamAppId,
        steamName: steamMatch.steamName,
      };

      this.cache.set(cacheKey, appInfo);
      return appInfo;
    } catch (error) {
      console.error(`Failed to find Steam app for "${gameName}":`, error);
      return null;
    }
  }

  /**
   * Extract review data from Steam store page
   */
  private static extractReviewData($: cheerio.CheerioAPI): SteamReviewData {
    const extractReviewText = (titleLabel: string): string | null => {
      let reviewText: string | null = null;

      // Try new structure first (.review_score_summaries)
      $('.review_score_summaries .review_summary_ctn').each((_, section) => {
        const title = $(section).find('.title').text().trim();
        if (title === titleLabel) {
          const text = $(section).find('.game_review_summary').text().trim();
          if (text) {
            reviewText = text;
            return false; // Break out of the loop
          }
        }
      });

      // Fallback to old structure if not found (.summary_section)
      if (!reviewText) {
        $('.summary_section').each((_, section) => {
          const title = $(section).find('.title').text().trim();
          if (title === titleLabel) {
            const text = $(section).find('.game_review_summary').text().trim();
            if (text) {
              reviewText = text;
              return false; // Break out of the loop
            }
          }
        });
      }

      return reviewText;
    };

    // Extract reviews with priority logic:
    // 1. Recent Reviews: Available for popular games with lots of recent activity
    // 2. Overall/English Reviews: Fallback for games with fewer reviews
    // 3. Use recent as overall if no overall review found

    const steam_recent_review = extractReviewText('Recent Reviews:');

    let steam_all_review = extractReviewText('Overall Reviews:');
    if (!steam_all_review) {
      steam_all_review = extractReviewText('English Reviews:');
    }

    if (!steam_all_review && steam_recent_review) {
      steam_all_review = steam_recent_review;
    }

    return {
      steam_all_review,
      steam_recent_review,
    };
  }

  /**
   * Extract popular tags from Steam store page
   */
  private static extractTagsData($: cheerio.CheerioAPI): SteamTagsData {
    const tags: string[] = [];

    // Look for the glance_tags popular_tags section
    $('.glance_tags.popular_tags a').each((_, element) => {
      const tagText = $(element).text().trim();
      if (tagText) {
        tags.push(tagText);
      }
    });

    return {
      steam_popular_tags: tags.length > 0 ? tags : null,
    };
  }

  /**
   * Extract metadata from Steam store page
   */
  private static extractMetadata($: cheerio.CheerioAPI): SteamMetadata {
    // Extract price information
    const priceElement = $('.game_purchase_price, .discount_final_price');
    const steam_price =
      priceElement.length > 0 ? priceElement.first().text().trim() : null;

    // Extract discount information
    const discountElement = $('.discount_pct');
    const steam_discount =
      discountElement.length > 0 ? discountElement.text().trim() : null;

    // Extract release date
    const releaseDateElement = $('.release_date .date');
    const steam_release_date =
      releaseDateElement.length > 0 ? releaseDateElement.text().trim() : null;

    return {
      steam_price,
      steam_discount,
      steam_release_date,
    };
  }

  /**
   * Get comprehensive Steam data for a game by Steam App ID
   */
  static async getCompleteSteamDataByAppId(
    steamAppId: number,
  ): Promise<SteamIntegrationResult> {
    const cacheKey = `complete_data_${steamAppId}`;
    const cached = this.cache.get<CompleteSteamData>(cacheKey);

    if (cached) {
      return { success: true, data: cached };
    }

    try {
      const $ = await this.fetchStorePage(steamAppId);
      if (!$) {
        return {
          success: false,
          data: { steamAppId },
          error: 'Failed to fetch Steam store page',
        };
      }

      const reviewData = this.extractReviewData($);
      const tagsData = this.extractTagsData($);
      const metadata = this.extractMetadata($);

      const completeData: CompleteSteamData = {
        steamAppId,
        steamName: '', // This will be filled in getCompleteSteamDataByName
        ...reviewData,
        ...tagsData,
        ...metadata,
      };

      this.cache.set(cacheKey, completeData);

      return {
        success: true,
        data: completeData,
      };
    } catch (error) {
      console.error(
        `Failed to get complete Steam data for app ${steamAppId}:`,
        error,
      );
      return {
        success: false,
        data: { steamAppId },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get comprehensive Steam data for a game by name
   */
  static async getCompleteSteamDataByName(
    gameName: string,
  ): Promise<SteamIntegrationResult> {
    try {
      const steamApp = await this.findSteamApp(gameName);
      if (!steamApp) {
        return {
          success: false,
          data: {},
          error: `No Steam app found for "${gameName}"`,
        };
      }

      const result = await this.getCompleteSteamDataByAppId(
        steamApp.steamAppId,
      );

      // Fill in the steam name
      if (result.success) {
        result.data.steamName = steamApp.steamName;
      }

      return result;
    } catch (error) {
      console.error(`Failed to get Steam data for "${gameName}":`, error);
      return {
        success: false,
        data: {},
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get only review data for a game
   */
  static async getReviewsOnly(
    gameName: string,
  ): Promise<SteamReviewData | null> {
    const result = await this.getCompleteSteamDataByName(gameName);
    if (result.success) {
      return {
        steam_all_review: result.data.steam_all_review || null,
        steam_recent_review: result.data.steam_recent_review || null,
      };
    }
    return null;
  }

  /**
   * Get only tags data for a game
   */
  static async getTagsOnly(gameName: string): Promise<SteamTagsData | null> {
    const result = await this.getCompleteSteamDataByName(gameName);
    if (result.success) {
      return {
        steam_popular_tags: result.data.steam_popular_tags || null,
      };
    }
    return null;
  }

  /**
   * Clear cache (useful for testing or manual cache management)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics (useful for monitoring)
   */
  static getCacheStats(): { size: number } {
    return {
      size: this.cache['cache'].size,
    };
  }
}
