import { useRef, useCallback } from 'react';

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

/**
 * Custom hook for throttled dislike API calls
 * Accumulates multiple clicks and sends them in batches to reduce server load
 *
 * @param options - Configuration options
 * @param options.onOptimisticUpdate - Callback when UI should update optimistically
 * @param options.onError - Callback when API call fails
 * @param options.onSuccess - Callback when API call succeeds
 * @param options.throttleDelay - Delay in ms before sending accumulated clicks (default: 500ms)
 *
 * @example
 * const { sendDislike } = useThrottledDislike({
 *   onOptimisticUpdate: (increment) => {
 *     setLocalCount(prev => prev + increment);
 *   },
 *   onError: (error, increment) => {
 *     setLocalCount(prev => prev - increment); // Revert
 *   },
 *   onSuccess: () => {
 *     mutate(); // Refresh data
 *   }
 * });
 *
 * // In your click handler
 * const handleClick = () => {
 *   const increment = isPowerMode ? 3 : 1;
 *   sendDislike(game.igdbId, increment);
 * };
 */
export function useThrottledDislike(
  options: ThrottledDislikeOptions = {},
): ThrottledDislikeReturn {
  const {
    onOptimisticUpdate,
    onError,
    onSuccess,
    throttleDelay = 500,
  } = options;

  // Map to track pending increments per game
  const pendingIncrementsRef = useRef<Map<number, number>>(new Map());

  // Map to track timers per game
  const throttledTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  /**
   * Send dislike request with throttling
   * Accumulates increments and sends after throttleDelay ms of inactivity
   */
  const sendDislike = useCallback(
    (igdbId: number, increment: number) => {
      // Optimistically update UI immediately
      if (onOptimisticUpdate) {
        onOptimisticUpdate(increment);
      }

      // Accumulate clicks for throttled sending
      const currentPending = pendingIncrementsRef.current.get(igdbId) || 0;
      pendingIncrementsRef.current.set(igdbId, currentPending + increment);

      // Clear existing timer for this game
      const existingTimer = throttledTimersRef.current.get(igdbId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer: send accumulated clicks after throttleDelay ms of inactivity
      const timer = setTimeout(async () => {
        const totalIncrement = pendingIncrementsRef.current.get(igdbId) || 0;

        if (totalIncrement > 0) {
          try {
            const response = await fetch('/api/games/dislike', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                igdbId,
                incrementBy: totalIncrement,
              }),
            });

            const result = await response.json();

            if (!result.success) {
              const error = new Error(
                result.error || 'Failed to update dislike count',
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
          pendingIncrementsRef.current.set(igdbId, 0);
        }

        // Clean up timer reference
        throttledTimersRef.current.delete(igdbId);
      }, throttleDelay);

      throttledTimersRef.current.set(igdbId, timer);
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
    sendDislike,
    clearPending,
  };
}
