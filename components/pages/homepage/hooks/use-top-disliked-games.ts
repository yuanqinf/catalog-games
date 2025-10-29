import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { triggerCountIncreaseAnimations } from '@/utils/animation-utils';

interface TopDislikedGame {
  id: number;
  igdb_id: number;
  name: string;
  slug: string;
  cover_url: string | null;
  banner_url: string | null;
  developers: string[] | null;
  dislike_count: number;
}

interface TopDislikedGamesResponse {
  success: boolean;
  data: TopDislikedGame[];
  error?: string;
}

export interface DissGameEntry {
  id: string;
  title: string;
  bannerUrl: string;
  developer: string;
  dislikeCount: number;
  rank: number;
  slug: string;
}

interface FloatingThumb {
  id: string;
  gameId: string;
  timestamp: number;
  startX: number;
  isPowerMode?: boolean;
}

interface UseTopDislikedGamesOptions {
  initialData?: TopDislikedGame[];
}

export function useTopDislikedGames(options?: UseTopDislikedGamesOptions) {
  const [dissGameData, setDissGameData] = useState<DissGameEntry[]>([]);
  const [floatingThumbs, setFloatingThumbs] = useState<FloatingThumb[]>([]);
  const updateCountRef = useRef(0);

  // Transform initialData if provided
  const initialResponse = options?.initialData
    ? { success: true, data: options.initialData }
    : undefined;

  const {
    data: topDislikedGamesResponse,
    error,
    isLoading,
    mutate,
  } = useSWR<TopDislikedGamesResponse>(
    '/api/games/top-disliked?limit=10',
    (url) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch top disliked games');
        return res.json();
      }),
    {
      fallbackData: initialResponse,
      revalidateOnFocus: false,
      refreshInterval: 5000,
      dedupingInterval: 2000,
      revalidateOnReconnect: false,
    },
  );

  useEffect(() => {
    if (topDislikedGamesResponse?.data) {
      setDissGameData((prevData) => {
        const transformedData = topDislikedGamesResponse.data.map(
          (game, index) => ({
            id: game.igdb_id.toString(),
            title: game.name,
            bannerUrl: game.banner_url || game.cover_url || '',
            developer: game.developers?.[0] || 'Unknown Developer',
            dislikeCount: game.dislike_count,
            rank: index + 1,
            slug: game.slug,
          }),
        );

        // Check if should skip animation BEFORE incrementing
        const shouldSkipAnimation = options?.initialData
          ? updateCountRef.current < 2
          : updateCountRef.current < 1;

        // Increment update counter
        updateCountRef.current += 1;

        // Skip animations for:
        // 1. First update (initial fallbackData)
        // 2. Second update (first real fetch after fallbackData)
        // Only show animations from the 3rd update onwards (polling updates)
        if (!shouldSkipAnimation && prevData.length > 0) {
          transformedData.forEach((newGame) => {
            const oldGame = prevData.find((g) => g.id === newGame.id);
            if (oldGame && oldGame.dislikeCount < newGame.dislikeCount) {
              triggerCountIncreaseAnimations(
                newGame.id,
                oldGame.dislikeCount,
                newGame.dislikeCount,
                setFloatingThumbs,
                (itemId, animationId) => ({
                  id: animationId,
                  gameId: itemId,
                  timestamp: Date.now(),
                  startX: 20 + Math.random() * 60,
                  isPowerMode: false,
                }),
                'thumb-polling',
              );
            }
          });
        }

        return transformedData;
      });
    }
  }, [topDislikedGamesResponse?.data, options?.initialData]);

  return {
    dissGameData,
    setDissGameData,
    floatingThumbs,
    setFloatingThumbs,
    topDislikedGamesResponse,
    error,
    isLoading,
    mutate,
  };
}
