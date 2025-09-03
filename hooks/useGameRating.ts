import useSWR from 'swr';
import { GameService } from '@/lib/supabase/client';
import type { GameRating } from '@/types';

// Define the new third party review interface
interface ThirdPartyGameReview {
  id: number;
  game_id: number;
  published_date?: string;
  external_url: string;
  snippet_content?: string;
  score?: number;
  np_score?: number;
  outlet_name?: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

interface UseGameRatingReturn {
  rating: GameRating;
  overallAverage?: number; // Only available for average ratings
  isLoading: boolean;
  error: any;
  mutate: () => void;
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

// Fetch average ratings from all users
const fetchAverageRating = async (
  gameId: number,
): Promise<AverageRatingData> => {
  const gameService = new GameService();
  const averageRating = await gameService.getAverageGameRatingsByGameId(gameId);
  const overall = calculateOverallAverage(averageRating);

  return {
    rating: averageRating,
    overallAverage: overall,
  };
};

// Fetch specific user's rating
const fetchUserRating = async (
  gameId: number,
  userId: string,
): Promise<GameRating> => {
  const gameService = new GameService();
  const userRating = await gameService.getUserRating(gameId, userId);

  if (!userRating) {
    return defaultRating;
  }

  return {
    story: userRating.story,
    music: userRating.music,
    graphics: userRating.graphics,
    gameplay: userRating.gameplay,
    longevity: userRating.longevity,
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
    ([, gId, uId]) => fetchUserRating(gId as number, uId as string),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2 * 60 * 1000, // 2 minutes
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      onSuccess: () =>
        console.log(`💾 Cached user rating for game ${numericGameId}`),
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
      onSuccess: () =>
        console.log(`💾 Cached average rating for game ${numericGameId}`),
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

/**
 * Hook for fetching third party game reviews (OpenCritic)
 */
export function useGameReviews(gameId: number | string | undefined) {
  const numericGameId = typeof gameId === 'string' ? parseInt(gameId) : gameId;

  const { data, error, isLoading, mutate } = useSWR(
    numericGameId ? ['third-party-reviews', numericGameId] : null,
    async ([, gId]) => {
      const gameService = new GameService();
      return await gameService.getGameReviews(gId as number);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      onSuccess: () =>
        console.log(`💾 Cached third party reviews for game ${numericGameId}`),
      onError: (err) =>
        console.error('Failed to fetch third party reviews:', err),
    },
  );

  return {
    reviews: (data as ThirdPartyGameReview[]) || [],
    isLoading,
    error,
    mutate,
  };
}
