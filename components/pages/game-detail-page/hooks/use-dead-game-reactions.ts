import { useState } from 'react';
import useSWR from 'swr';
import { triggerCountIncreaseAnimations } from '@/utils/animation-utils';
import { DeadGameFromAPI } from '@/types';

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
      const response = await fetch(`/api/dead-games/${deadGameId}/ghost-count`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch ghost count');
      }

      return {
        ghostCount: result.ghostCount ?? 0,
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
