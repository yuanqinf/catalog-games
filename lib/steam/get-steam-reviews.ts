/**
 * Steam user reviews fetching utility
 * Gets the most helpful reviews using Steam's official API
 */

import { findBestSteamMatch } from '@/lib/steam/find-best-steam-match';
import { createHash } from 'crypto';

export interface SteamReview {
  review_id: string;
  game_id: number | null;
  source: string;
  content: string;
  original_published_at: string;
}

export interface SteamReviewsResult {
  steamAppId: number | null;
  steamName: string | null;
  reviews: SteamReview[];
}

interface SteamAPIReview {
  recommendationid: string;
  review: string;
  timestamp_created: number;
  votes_up: number;
}

interface SteamAPIResponse {
  success: number;
  reviews: SteamAPIReview[];
}

/**
 * Generate unique review ID
 */
function generateReviewId(
  recommendationId: string,
  steamAppId: number,
): string {
  const hash = createHash('md5')
    .update(`${steamAppId}-${recommendationId}`)
    .digest('hex');
  return hash.slice(0, 12);
}

/**
 * Convert Unix timestamp to ISO string
 */
function convertTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Fetch Steam reviews using the official API
 */
async function fetchSteamReviewsByAppId(
  steamAppId: number,
  limit: number = 10,
): Promise<SteamReview[]> {
  const apiUrl = `https://store.steampowered.com/appreviews/${steamAppId}`;

  const params = new URLSearchParams({
    json: '1',
    filter: 'helpful',
    language: 'english',
    cursor: '*',
    review_type: 'all',
    purchase_type: 'all',
    num_per_page: '20',
  });

  try {
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Steam API error: ${response.status}`);
      return [];
    }

    const data: SteamAPIResponse = await response.json();

    if (data.success !== 1 || !data.reviews) {
      return [];
    }

    // Sort by votes_up and take top reviews
    const sortedReviews = data.reviews
      .sort((a, b) => (b.votes_up || 0) - (a.votes_up || 0))
      .slice(0, limit);

    // Transform to our format
    return sortedReviews.map((apiReview) => ({
      review_id: generateReviewId(apiReview.recommendationid, steamAppId),
      game_id: null,
      source: 'steam',
      content: apiReview.review,
      original_published_at: convertTimestamp(apiReview.timestamp_created),
    }));
  } catch (error) {
    console.error('Failed to fetch Steam reviews:', error);
    return [];
  }
}

/**
 * Find Steam match and fetch reviews for a game name
 */
export async function findSteamReviews(
  igdbName: string,
  limit: number = 10,
): Promise<SteamReviewsResult> {
  const match = await findBestSteamMatch(igdbName);

  if (!match || !match.steamAppId) {
    return {
      steamAppId: null,
      steamName: null,
      reviews: [],
    };
  }

  const reviews = await fetchSteamReviewsByAppId(match.steamAppId, limit);

  return {
    steamAppId: match.steamAppId,
    steamName: match.steamName,
    reviews,
  };
}

/**
 * Fetch reviews for a known Steam App ID
 */
export async function getSteamReviewsById(
  steamAppId: number,
  steamName?: string,
  limit: number = 10,
): Promise<SteamReviewsResult> {
  const reviews = await fetchSteamReviewsByAppId(steamAppId, limit);

  return {
    steamAppId,
    steamName: steamName || null,
    reviews,
  };
}
