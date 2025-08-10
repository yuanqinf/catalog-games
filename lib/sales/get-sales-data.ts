import { fetchSteamSalesDataFromSteamSpy } from '@/lib/steam/steamspy';

/**
 * Sales data fetching utility
 * Handles VGChartz primary data with Steam sales fallback
 */

export interface SalesData {
  value: number | null;
  source: 'vgchartz' | 'steam' | null;
  asOfDate?: string | null;
}

export interface SalesDataResult {
  salesData: SalesData;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetch VGChartz sales data by game slug
 */
async function fetchVGChartzData(gameSlug: string): Promise<{
  shippedUnits: number | null;
  asOfDate: string | null;
} | null> {
  try {
    const response = await fetch(
      `/api/vgchartz?slug=${encodeURIComponent(gameSlug)}`,
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    const shippedUnits = result.data?.shippedUnits;
    const asOfDate = result.data?.asOfDate;

    // Check if VGChartz has valid sales data
    if (shippedUnits && shippedUnits > 0) {
      return { shippedUnits, asOfDate };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch VGChartz data:', error);
    return null;
  }
}

/**
 * Fetch sales data with fallback logic:
 * 1. Try VGChartz first (primary source)
 * 2. If VGChartz fails or has no valid data, try Steam (fallback)
 * 3. Return null if both fail
 */
export async function fetchSalesData(
  gameSlug?: string,
  gameName?: string,
): Promise<SalesData> {
  try {
    // First, try VGChartz data if we have a slug
    if (gameSlug) {
      const vgchartzData = await fetchVGChartzData(gameSlug);
      if (vgchartzData) {
        return {
          value: vgchartzData.shippedUnits,
          source: 'vgchartz',
          asOfDate: vgchartzData.asOfDate,
        };
      }
    }

    // If VGChartz data is not valid, try Steam sales as fallback
    if (gameName) {
      const steamspyData = await fetchSteamSalesDataFromSteamSpy(gameName);
      if (steamspyData) {
        return {
          value: steamspyData.ownersLowerBound,
          source: 'steam',
        };
      }
    }

    // If both fail, return null
    return { value: null, source: null };
  } catch (error) {
    console.error('Failed to fetch sales data:', error);
    return { value: null, source: null };
  }
}

/**
 * Hook-style function for React components
 * Returns sales data with loading state
 */
export async function useSalesData(
  gameSlug?: string,
  gameName?: string,
): Promise<SalesData> {
  return fetchSalesData(gameSlug, gameName);
}

/**
 * Format sales value for display
 */
export function formatSalesValue(
  value: number | null,
  source: 'vgchartz' | 'steam' | null,
): string {
  if (!value) return 'N/A';

  const formattedValue = value.toLocaleString();

  // Add tilde prefix for VGChartz (approximate values)
  if (source === 'vgchartz') {
    return `~ ${formattedValue}`;
  } else if (source === 'steam') {
    return `> ${formattedValue}`;
  }

  return formattedValue;
}

/**
 * Get display label based on data source
 */
export function getSalesLabel(source: 'vgchartz' | 'steam' | null): string {
  switch (source) {
    case 'vgchartz':
      return 'Approx. Sales Volume';
    case 'steam':
      return 'Steam Owners';
    default:
      return 'Sales Data';
  }
}

/**
 * Get source name for display
 */
export function getSourceName(source: 'vgchartz' | 'steam' | null): string {
  switch (source) {
    case 'vgchartz':
      return 'VGChartz';
    case 'steam':
      return 'SteamSpy';
    default:
      return 'Unknown';
  }
}
