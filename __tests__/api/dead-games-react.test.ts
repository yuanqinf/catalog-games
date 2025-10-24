import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/dead-games/react/route';

// Mock dependencies
const mockIncrementDeadGameReaction = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  GameService: class GameService {
    incrementDeadGameReaction = mockIncrementDeadGameReaction;
  },
}));

vi.mock('@/lib/api/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ success: true, resetAt: Date.now() + 60000 })),
}));

vi.mock('@/lib/api/get-client-ip', () => ({
  getClientIP: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/api/body-size-limit', () => ({
  validateBodySize: vi.fn(() => null),
  BODY_SIZE_LIMITS: { STANDARD: 1024 },
}));

describe('/api/dead-games/react', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation', () => {
    it('should require deadGameId', async () => {
      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            incrementBy: 1,
          }),
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Dead game ID is required',
      });
    });

    it('should default incrementBy to 1 when not provided', async () => {
      mockIncrementDeadGameReaction.mockResolvedValue(100);

      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'dead_123',
          }),
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockIncrementDeadGameReaction).toHaveBeenCalledWith('dead_123', 1);
    });

    it('should reject non-integer incrementBy', async () => {
      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'dead_123',
            incrementBy: 1.5,
          }),
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid increment value. Must be a positive integer',
      });
    });

    it('should reject negative incrementBy', async () => {
      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'dead_123',
            incrementBy: -5,
          }),
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid increment value. Must be a positive integer',
      });
    });

    it('should reject zero incrementBy', async () => {
      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'dead_123',
            incrementBy: 0,
          }),
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Must be a positive integer');
    });

    it('should reject non-number incrementBy', async () => {
      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'dead_123',
            incrementBy: '5',
          }),
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Must be a positive integer');
    });
  });

  describe('Successful reactions', () => {
    it('should increment dead game reaction count', async () => {
      mockIncrementDeadGameReaction.mockResolvedValue(105);

      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'dead_123',
            incrementBy: 5,
          }),
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          deadGameId: 'dead_123',
          newReactionCount: 105,
          incrementBy: 5,
        },
      });
      expect(mockIncrementDeadGameReaction).toHaveBeenCalledWith('dead_123', 5);
    });

    it('should handle single increment', async () => {
      mockIncrementDeadGameReaction.mockResolvedValue(51);

      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'dead_456',
            incrementBy: 1,
          }),
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.incrementBy).toBe(1);
      expect(data.data.newReactionCount).toBe(51);
    });

    it('should handle large increment values (rapid clicking)', async () => {
      mockIncrementDeadGameReaction.mockResolvedValue(1050);

      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'dead_789',
            incrementBy: 50,
          }),
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.incrementBy).toBe(50);
      expect(mockIncrementDeadGameReaction).toHaveBeenCalledWith(
        'dead_789',
        50,
      );
    });
  });

  describe('Rate limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      const { rateLimit } = await import('@/lib/api/rate-limit');
      const resetTime = Date.now() + 30000;

      (rateLimit as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        success: false,
        resetAt: resetTime,
      });

      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'dead_123',
            incrementBy: 1,
          }),
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toEqual({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('Retry-After')).toBeTruthy();
    });

    it('should include rate limit headers', async () => {
      const { rateLimit } = await import('@/lib/api/rate-limit');
      const resetTime = Date.now() + 60000;

      (rateLimit as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        success: false,
        resetAt: resetTime,
      });

      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'dead_123',
            incrementBy: 1,
          }),
        },
      );

      const response = await POST(request as any);

      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
      const retryAfter = response.headers.get('Retry-After');
      expect(Number(retryAfter)).toBeGreaterThan(0);
    });
  });

  describe('Body size validation', () => {
    it('should reject oversized request body', async () => {
      const { validateBodySize } = await import('@/lib/api/body-size-limit');

      (validateBodySize as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Request body too large',
          }),
        status: 413,
      });

      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'dead_123',
            incrementBy: 1,
          }),
        },
      );

      const response = await POST(request as any);

      expect(response.status).toBe(413);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockIncrementDeadGameReaction.mockRejectedValue(
        new Error('Database error'),
      );

      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'dead_123',
            incrementBy: 1,
          }),
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Database error',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle non-Error exceptions', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockIncrementDeadGameReaction.mockRejectedValue('String error');

      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'dead_123',
            incrementBy: 1,
          }),
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Unknown error');

      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid JSON body', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: 'invalid json',
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('should handle string deadGameId', async () => {
      mockIncrementDeadGameReaction.mockResolvedValue(10);

      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'uuid-string-123',
            incrementBy: 1,
          }),
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.deadGameId).toBe('uuid-string-123');
    });

    it('should handle maximum safe integer', async () => {
      mockIncrementDeadGameReaction.mockResolvedValue(Number.MAX_SAFE_INTEGER);

      const request = new Request(
        'http://localhost:3000/api/dead-games/react',
        {
          method: 'POST',
          body: JSON.stringify({
            deadGameId: 'dead_max',
            incrementBy: 1,
          }),
        },
      );

      const response = await POST(request as any);
      const data = await response.json();

      expect(data.success).toBe(true);
    });
  });
});
