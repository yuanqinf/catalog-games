/**
 * Steam reviews fetching utility
 * Fetches Steam review data for games
 */

import * as cheerio from 'cheerio';
import { findBestSteamMatch } from '@/lib/steam/find-best-steam-match';

export interface SteamReviewsResult {
  steamAppId: number | null;
  steamName: string | null;
  steam_all_review: string | null;
  steam_recent_review: string | null;
}

/**
 * Extract review text from Steam store page HTML (updated for new structure)
 *
 * Handles both new structure (.review_score_summaries) and legacy structure (.summary_section)
 * New structure uses .review_summary_ctn containers with .title and .game_review_summary elements
 */
function extractReviewText(
  $: cheerio.CheerioAPI,
  titleLabel: string,
): string | null {
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
}

/**
 * Fetch Steam reviews by Steam App ID
 */
async function fetchSteamReviewsSummaryByAppId(steamAppId: number): Promise<{
  steam_all_review: string | null;
  steam_recent_review: string | null;
}> {
  const storeUrl = `https://store.steampowered.com/app/${steamAppId}`;

  try {
    const response = await fetch(storeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'text/html',
        Cookie: 'birthtime=946684800; lastagecheckage=1-January-2000',
      },
    });

    if (!response.ok) {
      console.error(`Steam store page error: ${response.status}`);
      return {
        steam_all_review: null,
        steam_recent_review: null,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract reviews with priority logic:
    // 1. Recent Reviews: Available for popular games with lots of recent activity
    // 2. Overall/English Reviews: Fallback for games with fewer reviews
    // 3. Use recent as overall if no overall review found

    let steam_recent_review = extractReviewText($, 'Recent Reviews:');

    let steam_all_review = extractReviewText($, 'Overall Reviews:');
    if (!steam_all_review) {
      steam_all_review = extractReviewText($, 'English Reviews:');
    }

    if (!steam_all_review && steam_recent_review) {
      steam_all_review = steam_recent_review;
    }

    // Debug logging
    console.log(`Steam reviews for App ID ${steamAppId}:`, {
      all_review: steam_all_review,
      recent_review: steam_recent_review,
    });

    return {
      steam_all_review,
      steam_recent_review,
    };
  } catch (error) {
    console.error('Failed to fetch Steam store page:', error);
    return {
      steam_all_review: null,
      steam_recent_review: null,
    };
  }
}

/**
 * Find Steam match and fetch reviews for an IGDB game name
 * This is the main function to get both Steam match and review data
 */
export async function findSteamReviewSummary(
  igdbName: string,
): Promise<SteamReviewsResult> {
  // First, find the Steam match
  const match = await findBestSteamMatch(igdbName);

  if (!match || !match.steamAppId) {
    return {
      steamAppId: null,
      steamName: null,
      steam_all_review: null,
      steam_recent_review: null,
    };
  }

  // Then fetch the reviews
  const reviewData = await fetchSteamReviewsSummaryByAppId(match.steamAppId);

  return {
    steamAppId: match.steamAppId,
    steamName: match.steamName,
    steam_all_review: reviewData.steam_all_review,
    steam_recent_review: reviewData.steam_recent_review,
  };
}

/**
 * Fetch reviews for a known Steam App ID (if you already have the Steam ID)
 */
export async function getSteamReviewsById(
  steamAppId: number,
  steamName?: string,
): Promise<SteamReviewsResult> {
  const reviewData = await fetchSteamReviewsSummaryByAppId(steamAppId);

  return {
    steamAppId,
    steamName: steamName || null,
    steam_all_review: reviewData.steam_all_review,
    steam_recent_review: reviewData.steam_recent_review,
  };
}
