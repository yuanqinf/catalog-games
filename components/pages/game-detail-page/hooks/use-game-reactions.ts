import { useState } from 'react';
import useSWR from 'swr';
import { useThrottledDislike } from '@/hooks/useThrottledDislike';
import { useThrottledEmojiReaction } from '@/hooks/useThrottledEmojiReaction';
import { triggerCountIncreaseAnimations } from '@/utils/animation-utils';

export interface FloatingThumb {
  id: string;
  timestamp: number;
  startX: number;
  startY: number;
  isPowerMode?: boolean;
}

export interface FloatingEmoji {
  id: string;
  icon: unknown;
  timestamp: number;
  startX: number;
  startY: number;
}

interface UserVoteState {
  continuousClicks: number;
  lastClickTime: number;
  isPowerMode: boolean;
}

export function useGameReactions(
  gameId: number | undefined,
  initialDislikeCount?: number,
) {
  const [floatingThumbs, setFloatingThumbs] = useState<FloatingThumb[]>([]);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [userVoteState, setUserVoteState] = useState<UserVoteState>({
    continuousClicks: 0,
    lastClickTime: 0,
    isPowerMode: false,
  });

  const { sendDislike } = useThrottledDislike({
    onSuccess: () => {
      mutateDislike();
    },
  });

  const { sendEmojiReaction } = useThrottledEmojiReaction({
    onSuccess: () => {
      mutateEmojiReactions();
    },
  });

  const {
    data: dislikeData,
    mutate: mutateDislike,
    isLoading: isLoadingUserDislike,
  } = useSWR<{
    dislikeCount: number;
    userDislikeCount: number;
  }>(
    gameId ? ['game-dislike', gameId] : null,
    async ([, id]: [string, number]) => {
      const [dislikeResponse, userDislikeResponse] = await Promise.all([
        fetch(`/api/games/dislike?gameId=${id}`),
        fetch(`/api/users/dislikes?gameId=${id}`),
      ]);

      const dislikeResult = await dislikeResponse.json();
      const userDislikeResult = await userDislikeResponse.json();

      return {
        dislikeCount: dislikeResult.success
          ? dislikeResult.data.dislikeCount
          : 0,
        userDislikeCount: userDislikeResult.success
          ? userDislikeResult.data.userDislikeCount
          : 0,
      };
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 5000,
      dedupingInterval: 2000,
      revalidateOnReconnect: false,
      onSuccess: (newData) => {
        if (
          dislikeData &&
          newData.dislikeCount > dislikeData.dislikeCount &&
          gameId
        ) {
          triggerCountIncreaseAnimations(
            gameId.toString(),
            dislikeData.dislikeCount,
            newData.dislikeCount,
            setFloatingThumbs,
            (itemId, animationId) => ({
              id: animationId,
              timestamp: Date.now(),
              startX: Math.random() * 70 + 15,
              startY: Math.random() * 30 + 60,
              isPowerMode: false,
            }),
            'thumb-polling',
          );
        }
      },
    },
  );

  const {
    data: emojiReactionsData,
    mutate: mutateEmojiReactions,
    isLoading: isLoadingEmojiReactions,
  } = useSWR(
    gameId ? `/api/games/emoji-reaction?gameId=${gameId}` : null,
    (url) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch emoji reactions');
        return res.json();
      }),
    {
      revalidateOnFocus: false,
      refreshInterval: 5000,
      dedupingInterval: 1000,
    },
  );

  const dislikeCount = dislikeData?.dislikeCount ?? initialDislikeCount ?? 0;
  const userDislikeCount = dislikeData?.userDislikeCount ?? 0;
  const emojiReactions = emojiReactionsData?.success
    ? emojiReactionsData.data
    : {};

  return {
    dislikeCount,
    userDislikeCount,
    emojiReactions,
    floatingThumbs,
    floatingEmojis,
    userVoteState,
    isLoadingEmojiReactions,
    isLoadingUserDislike,
    setFloatingThumbs,
    setFloatingEmojis,
    setUserVoteState,
    sendDislike,
    sendEmojiReaction,
    mutateDislike,
    mutateEmojiReactions,
  };
}
