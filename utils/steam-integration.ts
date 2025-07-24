/**
 * Steam integration utility for fetching review data
 */

export interface SteamData {
  steam_app_id?: number | null;
  steam_all_review?: string | null;
  steam_recent_review?: string | null;
}

/**
 * Fetch Steam reviews data via API route
 */
export async function fetchSteamReviews(gameName: string): Promise<SteamData> {
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
