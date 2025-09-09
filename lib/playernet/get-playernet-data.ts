export interface PlaytimeData {
  gameName: string;
  averagePlaytime: string | null;
  url: string | null;
  message?: string;
}

/**
 * Fetch game data from playtracker.net including playtime and recommendations
 * @param gameName - The name of the game to search for
 * @returns Promise<PlaytimeData> - Game data including playtime and recommended games
 */
export async function getPlaytrackerData(
  gameName: string,
): Promise<PlaytimeData> {
  try {
    const url = `/api/playtracker?q=${encodeURIComponent(gameName)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Playtracker API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data: PlaytimeData = await response.json();

    console.log(`🎮 Fetched playtracker data for: ${gameName}`);
    console.log(`⏱️ Average playtime: ${data.averagePlaytime || 'N/A'}`);
    console.log(`🎯 Recommendations: ${data.playersAlsoLiked.length} games`);

    return data;
  } catch (error) {
    console.error(
      `❌ Failed to fetch playtracker data for ${gameName}:`,
      error,
    );
    throw error;
  }
}
