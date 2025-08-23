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
 * Check if a game exists in Steam
 * @param gameName - The name of the game to search for
 * @returns Promise<boolean> - true if game exists in Steam, false otherwise
 */
export async function checkGameExistsInSteam(
  gameName: string,
): Promise<boolean> {
  try {
    console.log(`🔍 Checking if game exists in Steam: ${gameName}`);

    const response = await fetch(
      `/api/steam/review-summary?q=${encodeURIComponent(gameName)}`,
    );

    if (!response.ok) {
      console.log(
        `⚠️ Steam API request failed with status: ${response.status}`,
      );
      return false;
    }

    const result = await response.json();

    if (result.success && result.result.steamAppId) {
      console.log(
        `✅ Game found in Steam: ${gameName} (ID: ${result.result.steamAppId})`,
      );
      return true;
    } else {
      console.log(`❌ Game not found in Steam: ${gameName}`);
      return false;
    }
  } catch (error) {
    console.warn('Steam existence check failed:', error);
    return false;
  }
}
