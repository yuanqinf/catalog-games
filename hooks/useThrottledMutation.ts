import { useRef, useCallback } from 'react';

/**
 * Generic configuration for throttled mutations
 */
interface ThrottledMutationOptions<TPayload = any> {
  /**
   * API endpoint to call (e.g., '/api/games/dislike')
   */
  endpoint: string;

  /**
   * Function to build the request payload
   * @param key - The unique identifier (can be composite)
   * @param increment - The accumulated increment value
   */
  buildPayload: (key: string, increment: number) => TPayload;

  /**
   * Callback when UI should update optimistically
   * @param increment - The increment value for this click
   */
  onOptimisticUpdate?: (increment: number) => void;

  /**
   * Callback when API call fails
   * @param error - The error that occurred
   * @param increment - The increment that failed
   */
  onError?: (error: Error, increment: number) => void;

  /**
   * Callback when API call succeeds
   */
  onSuccess?: () => void;

  /**
   * Delay in ms before sending accumulated clicks (default: 500ms)
   */
  throttleDelay?: number;
}

interface ThrottledMutationReturn {
  /**
   * Send a mutation request with throttling
   * @param key - Unique identifier for the resource (can be composite like "gameId:emoji")
   * @param increment - The increment value (default: 1)
   */
  mutate: (key: string, increment?: number) => void;

  /**
   * Clear all pending requests (useful for cleanup)
   */
  clearPending: () => void;
}

/**
 * Generic hook for throttled API mutations
 * Accumulates multiple clicks and sends them in batches to reduce server load
 *
 * @example
 * // For game dislikes
 * const { mutate: sendDislike } = useThrottledMutation({
 *   endpoint: '/api/games/dislike',
 *   buildPayload: (igdbId, increment) => ({
 *     igdbId: Number(igdbId),
 *     incrementBy: increment,
 *   }),
 *   onOptimisticUpdate: (increment) => {
 *     setLocalCount(prev => prev + increment);
 *   },
 *   onError: (error, increment) => {
 *     setLocalCount(prev => prev - increment); // Revert
 *   },
 * });
 * sendDislike('123', 1);
 *
 * @example
 * // For emoji reactions
 * const { mutate: sendEmoji } = useThrottledMutation({
 *   endpoint: '/api/games/emoji-reaction',
 *   buildPayload: (key, increment) => {
 *     const [gameId, emojiName] = key.split(':');
 *     return {
 *       gameId: Number(gameId),
 *       emojiName,
 *       incrementBy: increment,
 *     };
 *   },
 * });
 * sendEmoji(`${gameId}:${emojiName}`, 1);
 */
export function useThrottledMutation<TPayload = any>(
  options: ThrottledMutationOptions<TPayload>,
): ThrottledMutationReturn {
  const {
    endpoint,
    buildPayload,
    onOptimisticUpdate,
    onError,
    onSuccess,
    throttleDelay = 500,
  } = options;

  // Map to track pending increments per key
  const pendingIncrementsRef = useRef<Map<string, number>>(new Map());

  // Map to track timers per key
  const throttledTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Send mutation request with throttling
   * Accumulates increments and sends after throttleDelay ms of inactivity
   */
  const mutate = useCallback(
    (key: string, increment: number = 1) => {
      // Optimistically update UI immediately
      if (onOptimisticUpdate) {
        onOptimisticUpdate(increment);
      }

      // Accumulate clicks for throttled sending
      const currentPending = pendingIncrementsRef.current.get(key) || 0;
      pendingIncrementsRef.current.set(key, currentPending + increment);

      // Clear existing timer for this key
      const existingTimer = throttledTimersRef.current.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer: send accumulated clicks after throttleDelay ms of inactivity
      const timer = setTimeout(async () => {
        const totalIncrement = pendingIncrementsRef.current.get(key) || 0;

        if (totalIncrement > 0) {
          try {
            const payload = buildPayload(key, totalIncrement);

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!result.success) {
              const error = new Error(
                result.error || 'Failed to execute mutation',
              );
              if (onError) {
                onError(error, totalIncrement);
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
    [
      endpoint,
      buildPayload,
      onOptimisticUpdate,
      onError,
      onSuccess,
      throttleDelay,
    ],
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
    mutate,
    clearPending,
  };
}
