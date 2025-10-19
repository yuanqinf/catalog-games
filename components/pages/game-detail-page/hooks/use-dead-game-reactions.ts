import { useState } from 'react';
import useSWR from 'swr';
import { triggerCountIncreaseAnimations } from '@/utils/animation-utils';
import { DeadGameFromAPI } from '@/types';
import { GameService } from '@/lib/supabase/client';

export interface FloatingGhost {
  id: string;
  timestamp: number;
  startX: number;
  startY: number;
}

export function useDeadGameReactions(
  deadGame: DeadGameFromAPI | null,
  isDeadGame: boolean,
) {
  const [floatingGhosts, setFloatingGhosts] = useState<FloatingGhost[]>([]);

  const { data: ghostData, mutate: mutateGhost } = useSWR<{
    ghostCount: number;
  }>(
    isDeadGame && deadGame?.id ? ['dead-game-ghost', deadGame.id] : null,
    async ([, deadGameId]: [string, string]) => {
      const gameService = new GameService();
      const deadGames = await gameService.getDeadGames();

      const currentDeadGame = (deadGames as unknown as DeadGameFromAPI[]).find(
        (dg: DeadGameFromAPI) => dg.id === deadGameId,
      );
      return {
        ghostCount: currentDeadGame?.user_reaction_count ?? 0,
      };
    },
    {
      revalidateOnFocus: false,
      refreshInterval: isDeadGame ? 5000 : 0,
      dedupingInterval: 2000,
      revalidateOnReconnect: false,
      onSuccess: (newData) => {
        if (
          ghostData &&
          newData.ghostCount > ghostData.ghostCount &&
          deadGame?.id
        ) {
          triggerCountIncreaseAnimations(
            deadGame.id,
            ghostData.ghostCount,
            newData.ghostCount,
            setFloatingGhosts,
            (itemId, animationId) => ({
              id: animationId,
              timestamp: Date.now(),
              startX: Math.random() * 70 + 15,
              startY: Math.random() * 30 + 60,
            }),
            'ghost-polling',
          );
        }
      },
    },
  );

  const ghostCount =
    ghostData?.ghostCount ?? deadGame?.user_reaction_count ?? 0;

  return {
    ghostCount,
    floatingGhosts,
    setFloatingGhosts,
    mutateGhost,
  };
}
