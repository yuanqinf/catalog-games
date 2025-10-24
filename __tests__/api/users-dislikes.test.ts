import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/users/dislikes/route';
import { currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  currentUser: vi.fn(),
}));

// Mock Supabase client
const mockFrom = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClerkSupabaseClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe('/api/users/dislikes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('gameId query mode', () => {
    it('should return 0 count for unauthenticated users', async () => {
      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request = new Request(
        'http://localhost:3000/api/users/dislikes?gameId=123',
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        data: {
          userDislikeCount: 0,
        },
      });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should return user dislike count for specific game', async () => {
      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user_123',
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: { count: 5 },
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      });

      const request = new Request(
        'http://localhost:3000/api/users/dislikes?gameId=123',
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        data: {
          userDislikeCount: 5,
        },
      });
      expect(mockFrom).toHaveBeenCalledWith('dislikes');
      expect(mockSelect).toHaveBeenCalledWith('count');
    });

    it('should return 0 when user has not disliked the game', async () => {
      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user_123',
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      });

      const request = new Request(
        'http://localhost:3000/api/users/dislikes?gameId=999',
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(data.data.userDislikeCount).toBe(0);
    });

    it('should handle database errors in gameId mode', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user_123',
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      });

      const request = new Request(
        'http://localhost:3000/api/users/dislikes?gameId=123',
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('total query mode', () => {
    it('should require authentication', async () => {
      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request = new Request(
        'http://localhost:3000/api/users/dislikes?total=true',
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'User not authenticated',
      });
    });

    it('should return total dislike count', async () => {
      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user_123',
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [{ count: 3 }, { count: 5 }, { count: 2 }],
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const request = new Request(
        'http://localhost:3000/api/users/dislikes?total=true',
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        data: {
          totalDislikes: 10,
        },
      });
      expect(mockFrom).toHaveBeenCalledWith('dislikes');
      expect(mockSelect).toHaveBeenCalledWith('count');
    });

    it('should handle empty dislikes array', async () => {
      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user_123',
      });

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
        'http://localhost:3000/api/users/dislikes?total=true',
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(data.data.totalDislikes).toBe(0);
    });

    it('should handle null counts in aggregation', async () => {
      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user_123',
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [{ count: 5 }, { count: null }, { count: 3 }],
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const request = new Request(
        'http://localhost:3000/api/users/dislikes?total=true',
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(data.data.totalDislikes).toBe(8);
    });
  });

  describe('list mode (default)', () => {
    it('should require authentication', async () => {
      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/users/dislikes');

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: 'User not authenticated',
      });
    });

    it('should return list of disliked games with user counts', async () => {
      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user_123',
      });

      const mockGamesData = [
        {
          count: 5,
          games: {
            id: 1,
            igdb_id: 1001,
            name: 'Game 1',
            slug: 'game-1',
            cover_url: 'https://example.com/cover1.jpg',
            dislike_count: 100,
          },
        },
        {
          count: 3,
          games: {
            id: 2,
            igdb_id: 1002,
            name: 'Game 2',
            slug: 'game-2',
            cover_url: 'https://example.com/cover2.jpg',
            dislike_count: 50,
          },
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: mockGamesData,
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const request = new Request('http://localhost:3000/api/users/dislikes');

      const response = await GET(request as any);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        data: [
          {
            id: 1,
            igdb_id: 1001,
            name: 'Game 1',
            slug: 'game-1',
            cover_url: 'https://example.com/cover1.jpg',
            dislike_count: 100,
            user_dislike_count: 5,
          },
          {
            id: 2,
            igdb_id: 1002,
            name: 'Game 2',
            slug: 'game-2',
            cover_url: 'https://example.com/cover2.jpg',
            dislike_count: 50,
            user_dislike_count: 3,
          },
        ],
      });
      expect(mockOrder).toHaveBeenCalledWith('count', { ascending: false });
    });

    it('should return empty array for user with no dislikes', async () => {
      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user_123',
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const request = new Request('http://localhost:3000/api/users/dislikes');

      const response = await GET(request as any);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        data: [],
      });
    });

    it('should order games by user dislike count descending', async () => {
      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user_123',
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const request = new Request('http://localhost:3000/api/users/dislikes');

      await GET(request as any);

      expect(mockOrder).toHaveBeenCalledWith('count', { ascending: false });
    });
  });

  describe('Error handling', () => {
    it('should handle errors and return 500', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      (currentUser as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Auth service unavailable'),
      );

      const request = new Request('http://localhost:3000/api/users/dislikes');

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Auth service unavailable');

      consoleErrorSpy.mockRestore();
    });

    it('should handle non-Error exceptions', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      (currentUser as ReturnType<typeof vi.fn>).mockRejectedValue(
        'String error',
      );

      const request = new Request('http://localhost:3000/api/users/dislikes');

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Unknown error');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('should handle total=false as list mode', async () => {
      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user_123',
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const request = new Request(
        'http://localhost:3000/api/users/dislikes?total=false',
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should handle gameId=0', async () => {
      (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'user_123',
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      });

      const request = new Request(
        'http://localhost:3000/api/users/dislikes?gameId=0',
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.userDislikeCount).toBe(0);
    });
  });
});
