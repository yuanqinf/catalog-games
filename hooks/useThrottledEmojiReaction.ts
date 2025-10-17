import { useRef, useCallback } from 'react';

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

/**
 * Custom hook for throttled emoji reaction API calls
 * Accumulates multiple emoji clicks and sends them in batches to reduce server load
 *
 * @param options - Configuration options
 * @param options.onOptimisticUpdate - Callback when UI should update optimistically
 * @param options.onError - Callback when API call fails
 * @param options.onSuccess - Callback when API call succeeds
 * @param options.throttleDelay - Delay in ms before sending accumulated clicks (default: 500ms)
 *
 * @example
 * const { sendEmojiReaction } = useThrottledEmojiReaction({
 *   onOptimisticUpdate: (emojiName, increment) => {
 *     setEmojiCounts(prev => ({
 *       ...prev,
 *       [emojiName]: (prev[emojiName] || 0) + increment
 *     }));
 *   },
 *   onError: (error, emojiName, increment) => {
 *     // Revert on error
 *   },
 *   onSuccess: () => {
 *     mutate(); // Refresh data
 *   }
 * });
 *
 * // In your click handler
 * const handleClick = (emojiName: string) => {
 *   sendEmojiReaction(gameId, emojiName);
 * };
 */
export function useThrottledEmojiReaction(
  options: ThrottledEmojiReactionOptions = {},
): ThrottledEmojiReactionReturn {
  const {
    onOptimisticUpdate,
    onError,
    onSuccess,
    throttleDelay = 500,
  } = options;

  // Map to track pending increments per game and emoji
  // Key format: "gameId:emojiName"
  const pendingIncrementsRef = useRef<Map<string, number>>(new Map());

  // Map to track timers per game-emoji combination
  const throttledTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Send emoji reaction request with throttling
   * Accumulates increments and sends after throttleDelay ms of inactivity
   */
  const sendEmojiReaction = useCallback(
    (gameId: number, emojiName: string) => {
      // Create unique key for this game-emoji combination
      const key = `${gameId}:${emojiName}`;

      // Optimistically update UI immediately
      if (onOptimisticUpdate) {
        onOptimisticUpdate(emojiName, 1);
      }

      // Accumulate clicks for throttled sending
      const currentPending = pendingIncrementsRef.current.get(key) || 0;
      pendingIncrementsRef.current.set(key, currentPending + 1);

      // Clear existing timer for this game-emoji
      const existingTimer = throttledTimersRef.current.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer: send accumulated clicks after throttleDelay ms of inactivity
      const timer = setTimeout(async () => {
        const totalIncrement = pendingIncrementsRef.current.get(key) || 0;

        if (totalIncrement > 0) {
          try {
            const response = await fetch('/api/games/emoji-reaction', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                gameId,
                emojiName,
                incrementBy: totalIncrement,
              }),
            });

            const result = await response.json();

            if (!result.success) {
              const error = new Error(
                result.error || 'Failed to save emoji reaction',
              );
              if (onError) {
                onError(error, emojiName, totalIncrement);
              }
            } else {
              if (onSuccess) {
                onSuccess();
              }
            }
          } catch (error) {
            if (onError) {
              onError(
                error instanceof Error ? error : new Error('Unknown error'),
                emojiName,
                totalIncrement,
              );
            }
          }

          // Clear the accumulated value after sending
          pendingIncrementsRef.current.set(key, 0);
        }

        // Clean up timer reference
        throttledTimersRef.current.delete(key);
      }, throttleDelay);

      throttledTimersRef.current.set(key, timer);
    },
    [onOptimisticUpdate, onError, onSuccess, throttleDelay],
  );

  /**
   * Clear all pending requests (useful for cleanup)
   */
  const clearPending = useCallback(() => {
    // Clear all timers
    throttledTimersRef.current.forEach((timer) => clearTimeout(timer));
    throttledTimersRef.current.clear();
    pendingIncrementsRef.current.clear();
  }, []);

  return {
    sendEmojiReaction,
    clearPending,
  };
}
