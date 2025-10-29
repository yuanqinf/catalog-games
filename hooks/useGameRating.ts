import useSWR from 'swr';
import type { GameRating } from '@/types';

interface UseGameRatingReturn {
  rating: GameRating;
  overallAverage?: number; // Only available for average ratings
  isLoading: boolean;
  error: any;
  mutate: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
}

interface AverageRatingData {
  rating: GameRating;
  overallAverage: number;
}

const defaultRating: GameRating = {
  story: 0,
  music: 0,
  graphics: 0,
  gameplay: 0,
  longevity: 0,
};

const calculateOverallAverage = (ratings: GameRating): number => {
  const { story, music, graphics, gameplay, longevity } = ratings;
  const total = story + music + graphics + gameplay + longevity;
  return total > 0 ? Number((total / 5).toFixed(1)) : 0;
};

// Fetch average ratings from all users via API
const fetchAverageRating = async (
  gameId: number,
): Promise<AverageRatingData> => {
  const response = await fetch(`/api/games/${gameId}/average-rating`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch average rating');
  }

  const averageRating = result.data;
  const overall = calculateOverallAverage(averageRating);

  return {
    rating: averageRating,
    overallAverage: overall,
  };
};

// Fetch specific user's rating via API
const fetchUserRating = async (gameId: number): Promise<GameRating> => {
  const response = await fetch(`/api/games/${gameId}/user-rating`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch user rating');
  }

  if (!result.data) {
    return defaultRating;
  }

  return {
    story: result.data.story,
    music: result.data.music,
    graphics: result.data.graphics,
    gameplay: result.data.gameplay,
    longevity: result.data.longevity,
  };
};

/**
 * Unified hook for game ratings
 * @param gameId - The game ID
 * @param userId - Optional user ID. If provided, fetches user-specific rating. If not, fetches average rating.
 */
export function useGameRating(
  gameId: number | string | undefined,
  userId?: string | undefined,
): UseGameRatingReturn {
  const isUserRating = !!userId;
  const numericGameId = typeof gameId === 'string' ? parseInt(gameId) : gameId;

  // Use separate SWR calls for different data types
  const userRatingResult = useSWR(
    isUserRating && numericGameId
      ? ['user-rating', numericGameId, userId]
      : null,
    ([, gId]) => fetchUserRating(gId as number),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2 * 60 * 1000, // 2 minutes
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      onError: (err) => console.error('Failed to fetch user rating:', err),
    },
  );

  const averageRatingResult = useSWR(
    !isUserRating && numericGameId ? ['average-rating', numericGameId] : null,
    ([, gId]) => fetchAverageRating(gId as number),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      onError: (err) => console.error('Failed to fetch average rating:', err),
    },
  );

  // Return appropriate result based on rating type
  if (isUserRating) {
    return {
      rating: userRatingResult.data || defaultRating,
      isLoading: userRatingResult.isLoading || false,
      error: userRatingResult.error,
      mutate: userRatingResult.mutate,
    };
  } else {
    return {
      rating: averageRatingResult.data?.rating || defaultRating,
      overallAverage: averageRatingResult.data?.overallAverage || 0,
      isLoading: averageRatingResult.isLoading || false,
      error: averageRatingResult.error,
      mutate: averageRatingResult.mutate,
    };
  }
}
