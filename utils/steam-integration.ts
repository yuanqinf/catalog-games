/**
 * Steam integration utility - Updated to use SteamIntegrationService
 */

import { SteamIntegrationService } from '@/lib/steam/steam-integration-service';

export interface SteamData {
  steam_app_id?: number;
  steam_all_review?: string;
  steam_recent_review?: string;
  steam_popular_tags?: string[];
}

/**
 * Fetch Steam popular tags data - handles both client and server environments
 */
export async function fetchSteamTags(gameName: string): Promise<SteamData> {
  try {
    // Check if we're running on the server side
    const isServer = typeof window === 'undefined';

    if (isServer) {
      // Server-side: Use SteamIntegrationService directly
      const tagsData = await SteamIntegrationService.getTagsOnly(gameName);

      if (tagsData && tagsData.steam_popular_tags) {
        // Also get app info for steam_app_id
        const appInfo = await SteamIntegrationService.findSteamApp(gameName);

        const steamData = {
          steam_app_id: appInfo?.steamAppId,
          steam_popular_tags: tagsData.steam_popular_tags,
        };

        return steamData;
      } else {
        return {};
      }
    } else {
      // Client-side: Use API route to avoid CORS
      const response = await fetch(
        `/api/steam/fetch-tags?gameName=${encodeURIComponent(gameName)}`,
      );

      if (!response.ok) {
        console.error(
          `Steam tags API responded with status: ${response.status}`,
        );
        return {};
      }

      const result = await response.json();

      return result;
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
 * Check if a game exists in Steam using our API route
 * @param gameName - The name of the game to search for
 * @returns Promise<boolean> - true if game exists in Steam, false otherwise
 */
export async function checkGameExistsInSteam(
  gameName: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/steam/check-game-exists?q=${encodeURIComponent(gameName)}`,
    );

    if (!response.ok) {
      console.error(
        `Steam check API responded with status: ${response.status}`,
      );
      return false;
    }

    const data = await response.json();

    if (data.exists) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.warn('Steam existence check failed:', error);
    return false;
  }
}
