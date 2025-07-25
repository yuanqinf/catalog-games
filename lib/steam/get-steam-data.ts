/**
 * Unified Steam data fetching utility
 * Fetches Steam reviews, tags, and other data for games
 */

import * as cheerio from 'cheerio';
import { findBestSteamMatch } from '@/lib/steam/find-best-steam-match';

export interface SteamDataResult {
  steamAppId: number | null;
  steamName: string | null;
  steam_all_review: string | null;
  steam_recent_review: string | null;
  steam_popular_tags: string[] | null;
}

/**
 * Extract review text from Steam store page HTML
 */
function extractReviewText(
  $: cheerio.CheerioAPI,
  titleLabel: string,
): string | null {
  let reviewText: string | null = null;

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

  return reviewText;
}

/**
 * Extract popular tags from Steam store page HTML
 */
function extractPopularTags($: cheerio.CheerioAPI): string[] | null {
  const tags: string[] = [];

  // Look for the glance_tags popular_tags section
  $('.glance_tags.popular_tags a').each((_, element) => {
    const tagText = $(element).text().trim();
    if (tagText) {
      tags.push(tagText);
    }
  });

  return tags.length > 0 ? tags : null;
}

/**
 * Fetch Steam data (reviews and tags) by Steam App ID
 */
async function fetchSteamDataByAppId(steamAppId: number): Promise<{
  steam_all_review: string | null;
  steam_recent_review: string | null;
  steam_popular_tags: string[] | null;
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
        steam_popular_tags: null,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract both reviews and tags from the same page
    const steam_all_review = extractReviewText($, 'Overall Reviews:');
    const steam_recent_review = extractReviewText($, 'Recent Reviews:');
    const steam_popular_tags = extractPopularTags($);

    return {
      steam_all_review,
      steam_recent_review,
      steam_popular_tags,
    };
  } catch (error) {
    console.error('Failed to fetch Steam store page:', error);
    return {
      steam_all_review: null,
      steam_recent_review: null,
      steam_popular_tags: null,
    };
  }
}

/**
 * Find Steam match and fetch all data (reviews + tags) for an IGDB game name
 * This is the main function to get complete Steam data
 */
export async function findSteamData(
  igdbName: string,
): Promise<SteamDataResult> {
  // First, find the Steam match
  const match = await findBestSteamMatch(igdbName);

  if (!match || !match.steamAppId) {
    return {
      steamAppId: null,
      steamName: null,
      steam_all_review: null,
      steam_recent_review: null,
      steam_popular_tags: null,
    };
  }

  // Then fetch all Steam data from the store page
  const steamData = await fetchSteamDataByAppId(match.steamAppId);

  return {
    steamAppId: match.steamAppId,
    steamName: match.steamName,
    steam_all_review: steamData.steam_all_review,
    steam_recent_review: steamData.steam_recent_review,
    steam_popular_tags: steamData.steam_popular_tags,
  };
}

/**
 * Fetch all Steam data for a known Steam App ID (if you already have the Steam ID)
 */
export async function getSteamDataById(
  steamAppId: number,
  steamName?: string,
): Promise<SteamDataResult> {
  const steamData = await fetchSteamDataByAppId(steamAppId);

  return {
    steamAppId,
    steamName: steamName || null,
    steam_all_review: steamData.steam_all_review,
    steam_recent_review: steamData.steam_recent_review,
    steam_popular_tags: steamData.steam_popular_tags,
  };
}

// Legacy exports for backward compatibility
export async function findSteamReviewSummary(igdbName: string) {
  const data = await findSteamData(igdbName);
  return {
    steamAppId: data.steamAppId,
    steamName: data.steamName,
    steam_all_review: data.steam_all_review,
    steam_recent_review: data.steam_recent_review,
  };
}

export async function findSteamPopularTags(igdbName: string) {
  const data = await findSteamData(igdbName);
  return {
    steamAppId: data.steamAppId,
    steamName: data.steamName,
    steam_popular_tags: data.steam_popular_tags,
  };
}
