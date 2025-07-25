/**
 * Steam integration utility for fetching review data
 */

export interface SteamData {
  steam_app_id?: number;
  steam_all_review?: string;
  steam_recent_review?: string;
  steam_popular_tags?: string[];
}

// Steam Reviews Interface (importing from the reviews utility)
export interface SteamReviewsData {
  steamAppId: number | null;
  steamName: string | null;
  reviews: Array<{
    review_id: string;
    game_id: number | null;
    source: string;
    content: string;
    original_published_at: string;
  }>;
}

/**
 * Fetch Steam reviews data via API route
 */
export async function fetchSteamReviewSummary(
  gameName: string,
): Promise<SteamData> {
  try {
    console.log(`🎮 Fetching Steam reviews for: ${gameName}`);

    const response = await fetch(
      `/api/steam/review-summary?q=${encodeURIComponent(gameName)}`,
    );

    if (!response.ok) {
      console.log(
        `⚠️ Steam API request failed with status: ${response.status}`,
      );
      return {};
    }

    const result = await response.json();

    if (result.success && result.result.steamAppId) {
      const steamData = {
        steam_app_id: result.result.steamAppId,
        steam_all_review: result.result.steam_all_review,
        steam_recent_review: result.result.steam_recent_review,
      };

      console.log(
        `📊 Steam reviews added: Overall="${steamData.steam_all_review}", Recent="${steamData.steam_recent_review}"`,
      );

      return steamData;
    } else {
      console.log(`❌ No Steam match found for: ${gameName}`);
      return {};
    }
  } catch (error) {
    console.warn(
      'Steam reviews fetch failed, continuing without Steam data:',
      error,
    );
    return {};
  }
}

/**
 * Fetch Steam popular tags data via API route
 */
export async function fetchSteamTags(gameName: string): Promise<SteamData> {
  try {
    console.log(`🏷️ Fetching Steam tags for: ${gameName}`);

    const response = await fetch(
      `/api/steam/tags?q=${encodeURIComponent(gameName)}`,
    );

    if (!response.ok) {
      console.log(
        `⚠️ Steam tags API request failed with status: ${response.status}`,
      );
      return {};
    }

    const result = await response.json();

    if (result.success && result.result.steamAppId) {
      const steamData = {
        steam_app_id: result.result.steamAppId,
        steam_popular_tags: result.result.steam_popular_tags,
      };

      console.log(
        `🏷️ Steam tags added: ${steamData.steam_popular_tags?.length || 0} tags found`,
      );

      return steamData;
    } else {
      console.log(`❌ No Steam tags found for: ${gameName}`);
      return {};
    }
  } catch (error) {
    console.warn(
      'Steam tags fetch failed, continuing without Steam tags:',
      error,
    );
    return {};
  }
}

/**
 * Fetch Steam reviews data from our API route
 */
export async function fetchSteamReviewsData(
  gameName: string,
): Promise<SteamReviewsData> {
  try {
    const response = await fetch(
      `/api/steam/reviews-detail?q=${encodeURIComponent(gameName)}`,
    );

    if (!response.ok) {
      console.error(
        `Steam reviews API responded with status: ${response.status}`,
      );
      return {
        steamAppId: null,
        steamName: null,
        reviews: [],
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch Steam reviews:', error);
    return {
      steamAppId: null,
      steamName: null,
      reviews: [],
    };
  }
}
