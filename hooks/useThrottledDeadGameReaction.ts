import { useCallback } from 'react';
import { useThrottledMutation } from './useThrottledMutation';

interface ThrottledReactionOptions {
  onOptimisticUpdate?: (increment: number) => void;
  onError?: (error: Error, increment: number) => void;
  onSuccess?: () => void;
  throttleDelay?: number;
}

interface ThrottledReactionReturn {
  sendReaction: (deadGameId: string, increment: number) => void;
  clearPending: () => void;
}

export function useThrottledDeadGameReaction(
  options: ThrottledReactionOptions = {},
): ThrottledReactionReturn {
  const { mutate, clearPending } = useThrottledMutation({
    endpoint: '/api/dead-games/react',
    buildPayload: (key, increment) => ({
      deadGameId: key,
      incrementBy: increment,
    }),
    onOptimisticUpdate: options.onOptimisticUpdate,
    onError: options.onError,
    onSuccess: options.onSuccess,
    throttleDelay: options.throttleDelay,
  });

  const sendReaction = useCallback(
    (deadGameId: string, increment: number) => {
      mutate(deadGameId, increment);
    },
    [mutate],
  );

  return {
    sendReaction,
    clearPending,
  };
}
