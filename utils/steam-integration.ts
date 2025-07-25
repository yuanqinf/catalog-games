/**
 * Steam integration utility for fetching review data
 */

export interface SteamData {
  steam_app_id?: number | null;
  steam_all_review?: string | null;
  steam_recent_review?: string | null;
  steam_popular_tags?: string[] | null;
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
      `/api/steam/reviews?q=${encodeURIComponent(gameName)}`,
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
