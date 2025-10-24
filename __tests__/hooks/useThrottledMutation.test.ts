import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThrottledMutation } from '@/hooks/useThrottledMutation';

describe('useThrottledMutation', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should call optimistic update immediately', () => {
      const onOptimisticUpdate = vi.fn();

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload: (key, increment) => ({ key, increment }),
          onOptimisticUpdate,
        }),
      );

      act(() => {
        result.current.mutate('test-key', 1);
      });

      expect(onOptimisticUpdate).toHaveBeenCalledTimes(1);
      expect(onOptimisticUpdate).toHaveBeenCalledWith(1);
    });

    it('should default increment to 1 when not provided', () => {
      const onOptimisticUpdate = vi.fn();

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload: (key, increment) => ({ key, increment }),
          onOptimisticUpdate,
        }),
      );

      act(() => {
        result.current.mutate('test-key');
      });

      expect(onOptimisticUpdate).toHaveBeenCalledWith(1);
    });
  });

  describe('Throttling behavior', () => {
    it('should accumulate multiple increments before sending', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ success: true }),
      });

      const buildPayload = vi.fn((key, increment) => ({ key, increment }));

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload,
          throttleDelay: 500,
        }),
      );

      // Click 3 times quickly
      act(() => {
        result.current.mutate('game-123', 1);
        result.current.mutate('game-123', 1);
        result.current.mutate('game-123', 1);
      });

      // Should not send yet
      expect(mockFetch).not.toHaveBeenCalled();

      // Fast-forward time and flush promises
      await act(async () => {
        vi.runAllTimers();
      });

      // Should send once with accumulated value
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(buildPayload).toHaveBeenCalledWith('game-123', 3);
    });

    it('should reset timer on new increment', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload: (key, increment) => ({ key, increment }),
          throttleDelay: 500,
        }),
      );

      // First click
      act(() => {
        result.current.mutate('game-123', 1);
      });

      // Wait 300ms
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Second click (should reset timer)
      act(() => {
        result.current.mutate('game-123', 1);
      });

      // Wait another 300ms (total 600ms from first click, but only 300ms from second)
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should not have sent yet
      expect(mockFetch).not.toHaveBeenCalled();

      // Wait final 200ms to complete the 500ms from second click
      await act(async () => {
        vi.runAllTimers();
      });

      // Now should send with both increments
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple keys independently', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ success: true }),
      });

      const buildPayload = vi.fn((key, increment) => ({ key, increment }));

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload,
          throttleDelay: 500,
        }),
      );

      // Click on two different keys
      act(() => {
        result.current.mutate('game-123', 2);
        result.current.mutate('game-456', 3);
      });

      await act(async () => {
        vi.runAllTimers();
      });

      // Should send two separate requests
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(buildPayload).toHaveBeenCalledWith('game-123', 2);
      expect(buildPayload).toHaveBeenCalledWith('game-456', 3);
    });
  });

  describe('API integration', () => {
    it('should send correct payload to endpoint', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/games/dislike',
          buildPayload: (igdbId, increment) => ({
            igdbId: Number(igdbId),
            incrementBy: increment,
          }),
        }),
      );

      act(() => {
        result.current.mutate('1001', 5);
      });

      await act(async () => {
        vi.runAllTimers();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/games/dislike', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          igdbId: 1001,
          incrementBy: 5,
        }),
      });
    });

    it('should handle composite keys (e.g., gameId:emoji)', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ success: true }),
      });

      const buildPayload = vi.fn((key, increment) => {
        const [gameId, emoji] = key.split(':');
        return {
          gameId: Number(gameId),
          emoji,
          incrementBy: increment,
        };
      });

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/games/emoji',
          buildPayload,
        }),
      );

      act(() => {
        result.current.mutate('123:fire', 1);
      });

      await act(async () => {
        vi.runAllTimers();
      });

      expect(buildPayload).toHaveBeenCalledWith('123:fire', 1);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/games/emoji',
        expect.objectContaining({
          body: JSON.stringify({
            gameId: 123,
            emoji: 'fire',
            incrementBy: 1,
          }),
        }),
      );
    });
  });

  describe('Error handling', () => {
    it('should call onError when API returns error', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ success: false, error: 'API Error' }),
      });

      const onError = vi.fn();

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload: (key, increment) => ({ key, increment }),
          onError,
        }),
      );

      act(() => {
        result.current.mutate('test-key', 3);
      });

      await act(async () => {
        vi.runAllTimers();
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'API Error',
        }),
        3,
      );
    });

    it('should call onError when fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const onError = vi.fn();

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload: (key, increment) => ({ key, increment }),
          onError,
        }),
      );

      act(() => {
        result.current.mutate('test-key', 2);
      });

      await act(async () => {
        vi.runAllTimers();
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Network error',
        }),
        2,
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('String error');

      const onError = vi.fn();

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload: (key, increment) => ({ key, increment }),
          onError,
        }),
      );

      act(() => {
        result.current.mutate('test-key', 1);
      });

      await act(async () => {
        vi.runAllTimers();
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unknown error',
        }),
        1,
      );
    });
  });

  describe('Success callback', () => {
    it('should call onSuccess when API succeeds', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ success: true }),
      });

      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload: (key, increment) => ({ key, increment }),
          onSuccess,
        }),
      );

      act(() => {
        result.current.mutate('test-key', 1);
      });

      await act(async () => {
        vi.runAllTimers();
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('should not call onSuccess when API fails', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ success: false, error: 'Failed' }),
      });

      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload: (key, increment) => ({ key, increment }),
          onSuccess,
        }),
      );

      act(() => {
        result.current.mutate('test-key', 1);
      });

      await act(async () => {
        vi.runAllTimers();
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup and memory management', () => {
    it('should clear pending increments after sending', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ success: true }),
      });

      const buildPayload = vi.fn((key, increment) => ({ key, increment }));

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload,
        }),
      );

      act(() => {
        result.current.mutate('game-123', 3);
      });

      await act(async () => {
        vi.runAllTimers();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Click again after sending
      act(() => {
        result.current.mutate('game-123', 2);
      });

      await act(async () => {
        vi.runAllTimers();
      });

      // Should send with only the new increment (2), not accumulating from previous (3)
      expect(buildPayload).toHaveBeenLastCalledWith('game-123', 2);
    });

    it('should clear all pending requests with clearPending', () => {
      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload: (key, increment) => ({ key, increment }),
        }),
      );

      act(() => {
        result.current.mutate('game-123', 1);
        result.current.mutate('game-456', 2);
      });

      // Clear pending
      act(() => {
        result.current.clearPending();
      });

      // Fast-forward time
      act(() => {
        vi.runAllTimers();
      });

      // Should not have sent anything
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should cleanup timers on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { result, unmount } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload: (key, increment) => ({ key, increment }),
        }),
      );

      act(() => {
        result.current.mutate('game-123', 1);
        result.current.mutate('game-456', 2);
      });

      // Clear before unmount
      act(() => {
        result.current.clearPending();
      });

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);

      unmount();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Custom throttle delay', () => {
    it('should respect custom throttleDelay', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload: (key, increment) => ({ key, increment }),
          throttleDelay: 1000,
        }),
      );

      act(() => {
        result.current.mutate('test-key', 1);
      });

      // Wait 500ms (default delay)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should not have sent yet
      expect(mockFetch).not.toHaveBeenCalled();

      // Wait another 500ms (total 1000ms)
      await act(async () => {
        vi.runAllTimers();
      });

      // Now should send
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Concurrent mutations', () => {
    it('should handle rapid concurrent mutations correctly', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ success: true }),
      });

      const onOptimisticUpdate = vi.fn();

      const { result } = renderHook(() =>
        useThrottledMutation({
          endpoint: '/api/test',
          buildPayload: (key, increment) => ({ key, increment }),
          onOptimisticUpdate,
        }),
      );

      // Simulate 10 rapid clicks
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.mutate('game-123', 1);
        }
      });

      // Should call optimistic update 10 times
      expect(onOptimisticUpdate).toHaveBeenCalledTimes(10);

      await act(async () => {
        vi.runAllTimers();
      });

      // Should send only once with accumulated value
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          body: JSON.stringify({ key: 'game-123', increment: 10 }),
        }),
      );
    });
  });
});
