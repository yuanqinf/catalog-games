import { useCallback } from 'react';
import { useThrottledMutation } from './useThrottledMutation';

interface ThrottledDislikeOptions {
  onOptimisticUpdate?: (increment: number) => void;
  onError?: (error: Error, increment: number) => void;
  onSuccess?: () => void;
  throttleDelay?: number;
}

interface ThrottledDislikeReturn {
  sendDislike: (igdbId: number, increment: number) => void;
  clearPending: () => void;
}

export function useThrottledDislikeReaction(
  options: ThrottledDislikeOptions = {},
): ThrottledDislikeReturn {
  const { mutate, clearPending } = useThrottledMutation({
    endpoint: '/api/games/dislike',
    buildPayload: (key, increment) => ({
      igdbId: Number(key),
      incrementBy: increment,
    }),
    onOptimisticUpdate: options.onOptimisticUpdate,
    onError: options.onError,
    onSuccess: options.onSuccess,
    throttleDelay: options.throttleDelay,
  });

  const sendDislike = useCallback(
    (igdbId: number, increment: number) => {
      mutate(String(igdbId), increment);
    },
    [mutate],
  );

  return {
    sendDislike,
    clearPending,
  };
}
