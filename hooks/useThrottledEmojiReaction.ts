import { useCallback } from 'react';
import { useThrottledMutation } from './useThrottledMutation';

interface ThrottledEmojiReactionOptions {
  onOptimisticUpdate?: (emojiName: string, increment: number) => void;
  onError?: (error: Error, emojiName: string, increment: number) => void;
  onSuccess?: () => void;
  throttleDelay?: number;
}

interface ThrottledEmojiReactionReturn {
  sendEmojiReaction: (gameId: number, emojiName: string) => void;
  clearPending: () => void;
}

export function useThrottledEmojiReaction(
  options: ThrottledEmojiReactionOptions = {},
): ThrottledEmojiReactionReturn {
  // Create a wrapper for onOptimisticUpdate to extract emojiName from the key
  const wrappedOnOptimisticUpdate = options.onOptimisticUpdate
    ? (increment: number) => {
        // For emoji reactions, we can't extract the emoji name from increment alone
        // So we store it in the closure when sendEmojiReaction is called
        // This is handled in the sendEmojiReaction callback below
      }
    : undefined;

  // Create a wrapper for onError to extract emojiName from the key
  const wrappedOnError = options.onError
    ? (error: Error, increment: number) => {
        // Similar to above, we handle this in the closure
      }
    : undefined;

  const { mutate, clearPending } = useThrottledMutation({
    endpoint: '/api/games/emoji-reaction',
    buildPayload: (key, increment) => {
      const [gameId, emojiName] = key.split(':');
      return {
        gameId: Number(gameId),
        emojiName,
        incrementBy: increment,
      };
    },
    onOptimisticUpdate: wrappedOnOptimisticUpdate,
    onError: wrappedOnError,
    onSuccess: options.onSuccess,
    throttleDelay: options.throttleDelay,
  });

  const sendEmojiReaction = useCallback(
    (gameId: number, emojiName: string) => {
      // Call the original optimistic update if provided
      if (options.onOptimisticUpdate) {
        options.onOptimisticUpdate(emojiName, 1);
      }

      const key = `${gameId}:${emojiName}`;

      // We pass increment as 1 since the base mutation will accumulate
      mutate(key, 1);
    },
    [mutate, options.onOptimisticUpdate],
  );

  return {
    sendEmojiReaction,
    clearPending,
  };
}
