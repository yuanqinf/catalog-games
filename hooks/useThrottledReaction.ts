import { useRef, useCallback } from 'react';

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

/**
 * Custom hook for throttled dead game reaction API calls
 * Accumulates multiple clicks and sends them in batches to reduce server load
 *
 * @param options - Configuration options
 * @param options.onOptimisticUpdate - Callback when UI should update optimistically
 * @param options.onError - Callback when API call fails
 * @param options.onSuccess - Callback when API call succeeds
 * @param options.throttleDelay - Delay in ms before sending accumulated clicks (default: 500ms)
 *
 * @example
 * const { sendReaction } = useThrottledReaction({
 *   onOptimisticUpdate: (increment) => {
 *     setReactionCount(prev => prev + increment);
 *   },
 *   onError: (error, increment) => {
 *     setReactionCount(prev => prev - increment); // Revert
 *   },
 *   onSuccess: () => {
 *     mutate(); // Refresh data
 *   }
 * });
 *
 * // In your click handler
 * const handleClick = () => {
 *   sendReaction(deadGameId, 1);
 * };
 */
export function useThrottledReaction(
  options: ThrottledReactionOptions = {},
): ThrottledReactionReturn {
  const {
    onOptimisticUpdate,
    onError,
    onSuccess,
    throttleDelay = 500,
  } = options;

  // Map to track pending increments per dead game
  const pendingIncrementsRef = useRef<Map<string, number>>(new Map());

  // Map to track timers per dead game
  const throttledTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Send reaction request with throttling
   * Accumulates increments and sends after throttleDelay ms of inactivity
   */
  const sendReaction = useCallback(
    (deadGameId: string, increment: number) => {
      // Optimistically update UI immediately
      if (onOptimisticUpdate) {
        onOptimisticUpdate(increment);
      }

      // Accumulate clicks for throttled sending
      const currentPending = pendingIncrementsRef.current.get(deadGameId) || 0;
      pendingIncrementsRef.current.set(deadGameId, currentPending + increment);

      // Clear existing timer for this dead game
      const existingTimer = throttledTimersRef.current.get(deadGameId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer: send accumulated clicks after throttleDelay ms of inactivity
      const timer = setTimeout(async () => {
        const totalIncrement =
          pendingIncrementsRef.current.get(deadGameId) || 0;

        if (totalIncrement > 0) {
          try {
            const response = await fetch('/api/dead-games/react', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                deadGameId,
                incrementBy: totalIncrement,
              }),
            });

            const result = await response.json();

            if (!result.success) {
              const error = new Error(
                result.error || 'Failed to update reaction count',
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
          pendingIncrementsRef.current.set(deadGameId, 0);
        }

        // Clean up timer reference
        throttledTimersRef.current.delete(deadGameId);
      }, throttleDelay);

      throttledTimersRef.current.set(deadGameId, timer);
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
    sendReaction,
    clearPending,
  };
}
