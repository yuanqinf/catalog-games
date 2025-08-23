'use client';

import { useState, useEffect } from 'react';

// Simple in-memory cache for Steam reviews
const steamReviewsCache = new Map<
  string,
  {
    data: SteamReviewsData;
    timestamp: number;
  }
>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface SteamReviewsData {
  steam_all_review: string | null;
  steam_recent_review: string | null;
  steamAppId: number | null;
  steamName: string | null;
}

interface UseSteamReviewsResult {
  steamReviews: SteamReviewsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch Steam reviews in real-time (client-side only)
 * @param gameName - The name of the game to fetch Steam reviews for
 * @param enabled - Whether to auto-fetch on mount (default: true)
 */
export function useSteamReviews(
  gameName: string,
  enabled = true,
): UseSteamReviewsResult {
  const [steamReviews, setSteamReviews] = useState<SteamReviewsData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSteamReviews = async () => {
    if (!gameName.trim()) return;

    // Check cache first
    const cacheKey = gameName.toLowerCase().trim();
    const cached = steamReviewsCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      console.log(`🎯 Using cached Steam reviews for: ${gameName}`);
      setSteamReviews(cached.data);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🎮 Fetching real-time Steam reviews for: ${gameName}`);

      const response = await fetch(
        `/api/steam/review-summary?q=${encodeURIComponent(gameName)}`,
      );

      if (!response.ok) {
        console.log(
          `Steam API request failed with status: ${response.status} for game: ${gameName}`,
        );
        // Return empty data instead of throwing - game might not be on Steam
        const emptyData: SteamReviewsData = {
          steam_all_review: null,
          steam_recent_review: null,
          steamAppId: null,
          steamName: null,
        };
        setSteamReviews(emptyData);
        return;
      }

      const result = await response.json();

      if (result.success && result.result.steamAppId) {
        const reviewsData: SteamReviewsData = {
          steam_all_review: result.result.steam_all_review,
          steam_recent_review: result.result.steam_recent_review,
          steamAppId: result.result.steamAppId,
          steamName: result.result.steamName,
        };

        // Cache the results
        steamReviewsCache.set(cacheKey, {
          data: reviewsData,
          timestamp: now,
        });

        setSteamReviews(reviewsData);
        console.log(
          `📊 Steam reviews fetched and cached: Overall="${reviewsData.steam_all_review}", Recent="${reviewsData.steam_recent_review}"`,
        );
      } else {
        console.log(`❌ No Steam match found for: ${gameName}`);
        const emptyData: SteamReviewsData = {
          steam_all_review: null,
          steam_recent_review: null,
          steamAppId: null,
          steamName: null,
        };

        // Cache the empty result to avoid repeated failed requests
        steamReviewsCache.set(cacheKey, {
          data: emptyData,
          timestamp: now,
        });

        setSteamReviews(emptyData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Steam reviews fetch failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (enabled && gameName.trim()) {
      fetchSteamReviews();
    }
  }, [gameName, enabled]);

  return {
    steamReviews,
    isLoading,
    error,
    refetch: fetchSteamReviews,
  };
}
