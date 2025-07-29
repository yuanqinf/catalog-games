import { useState, useEffect, useRef } from 'react';
import { GameService } from '@/lib/supabase/client';
import type { GameRating } from '@/types';

interface RatingCache {
  data: GameRating;
  overallAverage: number;
  timestamp: number;
}

interface UseGameRatingCacheReturn {
  rating: GameRating;
  overallAverage: number;
  isLoading: boolean;
  error: string | null;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache utilities
const getCachedRating = (gameId: number): RatingCache | null => {
  try {
    const key = `game_rating_${gameId}`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data: RatingCache = JSON.parse(cached);
    const now = Date.now();

    if (now - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get cached rating:', error);
    return null;
  }
};

const setCachedRating = (
  gameId: number,
  rating: GameRating,
  overallAverage: number,
): void => {
  try {
    const key = `game_rating_${gameId}`;
    const cacheData: RatingCache = {
      data: rating,
      overallAverage,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to cache rating:', error);
  }
};

const calculateOverallAverage = (ratings: GameRating): number => {
  const { story, music, graphics, gameplay, longevity } = ratings;
  const total = story + music + graphics + gameplay + longevity;
  return total > 0 ? Number((total / 5).toFixed(1)) : 0;
};

export function useGameRatingCache(
  gameId: number | undefined,
): UseGameRatingCacheReturn {
  const [rating, setRating] = useState<GameRating>({
    story: 0,
    music: 0,
    graphics: 0,
    gameplay: 0,
    longevity: 0,
  });
  const [overallAverage, setOverallAverage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const fetchRating = async () => {
      if (!gameId) {
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cached = getCachedRating(gameId);
      if (cached && !hasInitialized.current) {
        console.log(`⚡️ Using cached rating for game ${gameId}`);
        setRating(cached.data);
        setOverallAverage(cached.overallAverage);
        setIsLoading(false);
        hasInitialized.current = true;
        return;
      }

      // If no cache or already initialized, fetch from server
      if (!hasInitialized.current) {
        setIsLoading(true);
      }

      try {
        const gameService = new GameService();
        const averageRating =
          await gameService.getAverageGameRatingsByGameId(gameId);
        const overall = calculateOverallAverage(averageRating);

        setRating(averageRating);
        setOverallAverage(overall);

        // Cache the result
        setCachedRating(gameId, averageRating, overall);
        console.log(`💾 Cached rating for game ${gameId}`);
      } catch (err) {
        console.error('Failed to fetch game rating:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch rating');
      } finally {
        setIsLoading(false);
        hasInitialized.current = true;
      }
    };

    fetchRating();
  }, [gameId]);

  return {
    rating,
    overallAverage,
    isLoading,
    error,
  };
}
