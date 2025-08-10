export interface SteamSpyData {
  ownersLowerBound: number | null;
  averagePlaytime: number | null;
}

/**
 * Fetch Steam sales data by game name
 */
export async function fetchSteamSalesDataFromSteamSpy(
  gameName: string,
): Promise<SteamSpyData | null> {
  try {
    const response = await fetch(
      `/api/steam/steamspy?name=${encodeURIComponent(gameName)}`,
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    const ownersLowerBound = result.data?.ownersLowerBound;
    const averagePlaytime = result.data?.averagePlaytime;

    // Check if Steam has valid ownership data
    if (ownersLowerBound && ownersLowerBound > 0) {
      return { ownersLowerBound, averagePlaytime };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch Steam sales data:', error);
    return null;
  }
}
