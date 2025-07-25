/**
 * Steam popular tags fetching utility
 * Fetches Steam popular tags for games
 */

import * as cheerio from 'cheerio';
import { findBestSteamMatch } from '@/lib/steam/find-best-steam-match';

export interface SteamTagsResult {
  steamAppId: number | null;
  steamName: string | null;
  steam_popular_tags: string[] | null;
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
 * Fetch Steam popular tags by Steam App ID
 */
async function fetchSteamTagsByAppId(steamAppId: number): Promise<{
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
        steam_popular_tags: null,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const steam_popular_tags = extractPopularTags($);

    return {
      steam_popular_tags,
    };
  } catch (error) {
    console.error('Failed to fetch Steam store page:', error);
    return {
      steam_popular_tags: null,
    };
  }
}

/**
 * Find Steam match and fetch popular tags for an IGDB game name
 * This is the main function to get both Steam match and popular tags data
 */
export async function findSteamPopularTags(
  igdbName: string,
): Promise<SteamTagsResult> {
  // First, find the Steam match
  const match = await findBestSteamMatch(igdbName);

  if (!match || !match.steamAppId) {
    return {
      steamAppId: null,
      steamName: null,
      steam_popular_tags: null,
    };
  }

  // Then fetch the popular tags
  const tagsData = await fetchSteamTagsByAppId(match.steamAppId);

  return {
    steamAppId: match.steamAppId,
    steamName: match.steamName,
    steam_popular_tags: tagsData.steam_popular_tags,
  };
}

/**
 * Fetch popular tags for a known Steam App ID (if you already have the Steam ID)
 */
export async function getSteamTagsById(
  steamAppId: number,
  steamName?: string,
): Promise<SteamTagsResult> {
  const tagsData = await fetchSteamTagsByAppId(steamAppId);

  return {
    steamAppId,
    steamName: steamName || null,
    steam_popular_tags: tagsData.steam_popular_tags,
  };
}
