import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET, DELETE } from '@/app/api/games/update-emoji-reaction/route';
import { currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  currentUser: vi.fn(),
}));

// Mock Supabase client
const mockRpc = vi.fn();
const mockFrom = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClerkSupabaseClient: vi.fn(() => ({
    rpc: mockRpc,
    from: mockFrom,
  })),
}));

// Mock rate limiting and validation
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

describe('/api/games/update-emoji-reaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST - Add/increment emoji reaction', () => {
    describe('Authentication', () => {
      it('should require authentication', async () => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({
              gameId: 123,
              emojiName: 'angry',
              incrementBy: 1,
            }),
          },
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toEqual({
          success: false,
          error: 'User not authenticated',
        });
      });
    });

    describe('Validation', () => {
      it('should require gameId and emojiName', async () => {
        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({}),
          },
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Game ID and emoji name are required');
      });

      it('should validate emojiName is a string', async () => {
        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({
              gameId: 123,
              emojiName: 123,
            }),
          },
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Emoji name must be a string');
      });

      it('should reject empty emojiName', async () => {
        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({
              gameId: 123,
              emojiName: '',
            }),
          },
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        // Empty string fails the required check first
        expect(data.error).toBe('Game ID and emoji name are required');
      });

      it('should reject emojiName longer than 50 characters', async () => {
        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({
              gameId: 123,
              emojiName: 'a'.repeat(51),
            }),
          },
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('between 1 and 50 characters');
      });

      it('should reject emojiName with special characters', async () => {
        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({
              gameId: 123,
              emojiName: 'angry@#$',
            }),
          },
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain(
          'can only contain letters, numbers, hyphens, and underscores',
        );
      });

      it('should reject emojiName not in whitelist', async () => {
        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({
              gameId: 123,
              emojiName: 'invalid-emoji',
            }),
          },
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid emoji name');
      });

      it('should accept case-insensitive emoji names', async () => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'user_123',
        });

        mockRpc.mockResolvedValue({
          data: { success: true, count: 5 },
          error: null,
        });

        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({
              gameId: 123,
              emojiName: 'ANGRY',
            }),
          },
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should reject incrementBy less than 1', async () => {
        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({
              gameId: 123,
              emojiName: 'angry',
              incrementBy: 0,
            }),
          },
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('between 1 and 100');
      });

      it('should reject incrementBy greater than 100', async () => {
        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({
              gameId: 123,
              emojiName: 'angry',
              incrementBy: 101,
            }),
          },
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('between 1 and 100');
      });

      it('should reject non-integer incrementBy', async () => {
        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({
              gameId: 123,
              emojiName: 'angry',
              incrementBy: 1.5,
            }),
          },
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Must be an integer');
      });
    });

    describe('Successful reactions', () => {
      beforeEach(() => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'user_123',
        });
      });

      it('should upsert emoji reaction', async () => {
        mockRpc.mockResolvedValue({
          data: { success: true, count: 10 },
          error: null,
        });

        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({
              gameId: 123,
              emojiName: 'angry',
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
            gameId: 123,
            emojiName: 'angry',
            newCount: 10,
          },
        });
        expect(mockRpc).toHaveBeenCalledWith('upsert_emoji_reaction', {
          p_clerk_id: 'user_123',
          p_game_id: 123,
          p_emoji_name: 'angry',
          p_increment: 5,
        });
      });

      it('should default incrementBy to 1', async () => {
        mockRpc.mockResolvedValue({
          data: { success: true, count: 1 },
          error: null,
        });

        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({
              gameId: 123,
              emojiName: 'poop',
            }),
          },
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(mockRpc).toHaveBeenCalledWith(
          'upsert_emoji_reaction',
          expect.objectContaining({
            p_increment: 1,
          }),
        );
      });

      it('should handle all allowed emojis', async () => {
        const allowedEmojis = [
          'angry',
          'frown',
          'tired',
          'dizzy',
          'surprised',
          'grin-beam-sweat',
          'sad-tear',
          'rolling-eyes',
          'meh',
          'grimace',
          'flushed',
          'grin-tongue',
          'heart-crack',
          'bug',
          'poop',
        ];

        for (const emoji of allowedEmojis) {
          mockRpc.mockResolvedValue({
            data: { success: true, count: 1 },
            error: null,
          });

          const request = new Request(
            'http://localhost:3000/api/games/update-emoji-reaction',
            {
              method: 'POST',
              body: JSON.stringify({
                gameId: 123,
                emojiName: emoji,
              }),
            },
          );

          const response = await POST(request as any);
          const data = await response.json();

          expect(data.success).toBe(true);
        }
      });
    });

    describe('Error handling', () => {
      beforeEach(() => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'user_123',
        });
      });

      it('should handle RPC errors', async () => {
        const consoleErrorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        mockRpc.mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        });

        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({
              gameId: 123,
              emojiName: 'angry',
            }),
          },
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to update reaction');

        consoleErrorSpy.mockRestore();
      });

      it('should handle RPC function returning failure', async () => {
        const consoleErrorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        mockRpc.mockResolvedValue({
          data: { success: false, error: 'Custom error' },
          error: null,
        });

        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'POST',
            body: JSON.stringify({
              gameId: 123,
              emojiName: 'angry',
            }),
          },
        );

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Custom error');

        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe('GET - Fetch emoji reactions', () => {
    describe('Validation', () => {
      it('should require gameId', async () => {
        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'GET',
          },
        );

        const response = await GET(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Game ID is required');
      });
    });

    describe('Successful fetch', () => {
      it('should fetch and aggregate emoji reactions', async () => {
        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockResolvedValue({
          data: [
            { emoji_name: 'angry', count: 5 },
            { emoji_name: 'poop', count: 3 },
            { emoji_name: 'angry', count: 2 }, // Duplicate to test aggregation
          ],
          error: null,
        });

        mockFrom.mockReturnValue({
          select: mockSelect,
        });

        mockSelect.mockReturnValue({
          eq: mockEq,
        });

        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction?gameId=123',
          {
            method: 'GET',
          },
        );

        const response = await GET(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          success: true,
          data: {
            angry: 7, // 5 + 2
            poop: 3,
          },
        });
      });

      it('should return empty object for game with no reactions', async () => {
        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockResolvedValue({
          data: [],
          error: null,
        });

        mockFrom.mockReturnValue({
          select: mockSelect,
        });

        mockSelect.mockReturnValue({
          eq: mockEq,
        });

        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction?gameId=999',
          {
            method: 'GET',
          },
        );

        const response = await GET(request as any);
        const data = await response.json();

        expect(data).toEqual({
          success: true,
          data: {},
        });
      });
    });

    describe('Error handling', () => {
      it('should handle database errors', async () => {
        const consoleErrorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        });

        mockFrom.mockReturnValue({
          select: mockSelect,
        });

        mockSelect.mockReturnValue({
          eq: mockEq,
        });

        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction?gameId=123',
          {
            method: 'GET',
          },
        );

        const response = await GET(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch emoji reactions');

        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe('DELETE - Remove emoji reactions', () => {
    describe('Authentication', () => {
      it('should require authentication', async () => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction?gameId=123',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request as any);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('User not authenticated');
      });
    });

    describe('Validation', () => {
      it('should require gameId', async () => {
        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Game ID is required');
      });
    });

    describe('Successful deletion', () => {
      beforeEach(() => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'user_123',
        });
      });

      it('should delete all emoji reactions for user and game', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockFinalEq = vi.fn().mockResolvedValue({
          error: null,
        });

        mockFrom.mockReturnValue({
          delete: mockDelete,
        });

        mockDelete.mockReturnValue({
          eq: mockEq,
        });

        mockEq.mockReturnValue({
          eq: mockFinalEq,
        });

        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction?gameId=123',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          success: true,
          data: {
            gameId: 123,
          },
        });
      });
    });

    describe('Error handling', () => {
      beforeEach(() => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'user_123',
        });
      });

      it('should handle database errors', async () => {
        const consoleErrorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const mockDelete = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockFinalEq = vi.fn().mockResolvedValue({
          error: { message: 'Database error' },
        });

        mockFrom.mockReturnValue({
          delete: mockDelete,
        });

        mockDelete.mockReturnValue({
          eq: mockEq,
        });

        mockEq.mockReturnValue({
          eq: mockFinalEq,
        });

        const request = new Request(
          'http://localhost:3000/api/games/update-emoji-reaction?gameId=123',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to remove emoji reactions');

        consoleErrorSpy.mockRestore();
      });
    });
  });
});
