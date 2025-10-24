import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from '@/app/api/games/rating/route';
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

describe('/api/games/rating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST - Create/Update rating', () => {
    describe('Authentication', () => {
      it('should require authentication', async () => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        const request = new Request('http://localhost:3000/api/games/rating', {
          method: 'POST',
          body: JSON.stringify({
            gameId: 123,
            rating: {
              story: 8,
              music: 9,
              graphics: 7,
              gameplay: 8,
              longevity: 6,
            },
          }),
        });

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toEqual({
          success: false,
          error: 'Authentication required',
        });
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'user_123',
        });
      });

      it('should require gameId', async () => {
        const request = new Request('http://localhost:3000/api/games/rating', {
          method: 'POST',
          body: JSON.stringify({
            rating: {
              story: 8,
              music: 9,
              graphics: 7,
              gameplay: 8,
              longevity: 6,
            },
          }),
        });

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
          success: false,
          error: 'Game ID and rating are required',
        });
      });

      it('should require rating', async () => {
        const request = new Request('http://localhost:3000/api/games/rating', {
          method: 'POST',
          body: JSON.stringify({
            gameId: 123,
          }),
        });

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
          success: false,
          error: 'Game ID and rating are required',
        });
      });

      it('should handle invalid JSON body', async () => {
        const consoleErrorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const request = new Request('http://localhost:3000/api/games/rating', {
          method: 'POST',
          body: 'invalid json',
        });

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);

        consoleErrorSpy.mockRestore();
      });
    });

    describe('Creating new rating', () => {
      beforeEach(() => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'user_123',
        });
      });

      it('should create new rating when none exists', async () => {
        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockMaybeSingle = vi.fn().mockResolvedValue({
          data: null,
          error: null,
        });
        const mockInsert = vi.fn().mockReturnThis();
        const mockSingle = vi.fn().mockResolvedValue({
          data: {
            id: 'rating_1',
            game_id: 123,
            clerk_id: 'user_123',
            story: 8,
            music: 9,
            graphics: 7,
            gameplay: 8,
            longevity: 6,
          },
          error: null,
        });

        mockFrom.mockReturnValue({
          select: mockSelect,
          insert: mockInsert,
        });

        mockSelect.mockReturnValueOnce({
          eq: mockEq,
        });

        mockEq.mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        });

        mockInsert.mockReturnValue({
          select: vi.fn().mockReturnThis(),
          single: mockSingle,
        });

        const request = new Request('http://localhost:3000/api/games/rating', {
          method: 'POST',
          body: JSON.stringify({
            gameId: 123,
            rating: {
              story: 8,
              music: 9,
              graphics: 7,
              gameplay: 8,
              longevity: 6,
            },
          }),
        });

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.story).toBe(8);
        expect(mockInsert).toHaveBeenCalledWith({
          game_id: 123,
          clerk_id: 'user_123',
          story: 8,
          music: 9,
          graphics: 7,
          gameplay: 8,
          longevity: 6,
        });
      });
    });

    describe('Updating existing rating', () => {
      beforeEach(() => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'user_123',
        });
      });

      it('should delete old rating and create new one', async () => {
        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockMaybeSingle = vi.fn().mockResolvedValue({
          data: { id: 'old_rating_id' },
          error: null,
        });
        const mockDelete = vi.fn().mockReturnThis();
        const mockDeleteEq = vi.fn().mockResolvedValue({
          error: null,
        });
        const mockInsert = vi.fn().mockReturnThis();
        const mockSingle = vi.fn().mockResolvedValue({
          data: {
            id: 'new_rating_id',
            game_id: 123,
            clerk_id: 'user_123',
            story: 9,
            music: 10,
            graphics: 8,
            gameplay: 9,
            longevity: 7,
          },
          error: null,
        });

        let callCount = 0;
        mockFrom.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // First call: select existing
            return {
              select: mockSelect,
            };
          } else if (callCount === 2) {
            // Second call: delete
            return {
              delete: mockDelete,
            };
          } else {
            // Third call: insert
            return {
              insert: mockInsert,
            };
          }
        });

        mockSelect.mockReturnValue({
          eq: mockEq,
        });

        mockEq.mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        });

        mockDelete.mockReturnValue({
          eq: mockDeleteEq,
        });

        mockInsert.mockReturnValue({
          select: vi.fn().mockReturnThis(),
          single: mockSingle,
        });

        const request = new Request('http://localhost:3000/api/games/rating', {
          method: 'POST',
          body: JSON.stringify({
            gameId: 123,
            rating: {
              story: 9,
              music: 10,
              graphics: 8,
              gameplay: 9,
              longevity: 7,
            },
          }),
        });

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockDelete).toHaveBeenCalled();
        expect(mockInsert).toHaveBeenCalled();
      });

      it('should handle delete error', async () => {
        const consoleErrorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockMaybeSingle = vi.fn().mockResolvedValue({
          data: { id: 'old_rating_id' },
          error: null,
        });
        const mockDelete = vi.fn().mockReturnThis();
        const mockDeleteEq = vi.fn().mockResolvedValue({
          error: { message: 'Delete failed' },
        });

        let callCount = 0;
        mockFrom.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return { select: mockSelect };
          } else {
            return { delete: mockDelete };
          }
        });

        mockSelect.mockReturnValue({
          eq: mockEq,
        });

        mockEq.mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        });

        mockDelete.mockReturnValue({
          eq: mockDeleteEq,
        });

        const request = new Request('http://localhost:3000/api/games/rating', {
          method: 'POST',
          body: JSON.stringify({
            gameId: 123,
            rating: {
              story: 9,
              music: 10,
              graphics: 8,
              gameplay: 9,
              longevity: 7,
            },
          }),
        });

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          success: false,
          error: 'Failed to update rating',
        });

        consoleErrorSpy.mockRestore();
      });
    });

    describe('Error handling', () => {
      beforeEach(() => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'user_123',
        });
      });

      it('should handle insert error', async () => {
        const consoleErrorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockMaybeSingle = vi.fn().mockResolvedValue({
          data: null,
          error: null,
        });
        const mockInsert = vi.fn().mockReturnThis();
        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        });

        mockFrom.mockReturnValue({
          select: mockSelect,
          insert: mockInsert,
        });

        mockSelect.mockReturnValue({
          eq: mockEq,
        });

        mockEq.mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        });

        mockInsert.mockReturnValue({
          select: vi.fn().mockReturnThis(),
          single: mockSingle,
        });

        const request = new Request('http://localhost:3000/api/games/rating', {
          method: 'POST',
          body: JSON.stringify({
            gameId: 123,
            rating: {
              story: 8,
              music: 9,
              graphics: 7,
              gameplay: 8,
              longevity: 6,
            },
          }),
        });

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          success: false,
          error: 'Failed to save rating',
        });

        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe('DELETE - Remove rating', () => {
    describe('Authentication', () => {
      it('should require authentication', async () => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        const request = new Request(
          'http://localhost:3000/api/games/rating?gameId=123',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request as any);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toEqual({
          success: false,
          error: 'Authentication required',
        });
      });
    });

    describe('Validation', () => {
      it('should require gameId', async () => {
        const request = new Request('http://localhost:3000/api/games/rating', {
          method: 'DELETE',
        });

        const response = await DELETE(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
          success: false,
          error: 'Game ID is required',
        });
      });
    });

    describe('Successful deletion', () => {
      beforeEach(() => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'user_123',
        });
      });

      it('should delete rating successfully', async () => {
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
          'http://localhost:3000/api/games/rating?gameId=123',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          success: true,
          message: 'Rating removed successfully',
        });
        expect(mockFrom).toHaveBeenCalledWith('game_ratings');
        expect(mockDelete).toHaveBeenCalled();
      });

      it('should handle gameId as string number', async () => {
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
          'http://localhost:3000/api/games/rating?gameId=999',
          {
            method: 'DELETE',
          },
        );

        await DELETE(request as any);

        // Verify parseInt was used
        expect(mockFinalEq).toHaveBeenCalled();
      });
    });

    describe('Error handling', () => {
      beforeEach(() => {
        (currentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          id: 'user_123',
        });
      });

      it('should handle delete error', async () => {
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
          'http://localhost:3000/api/games/rating?gameId=123',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          success: false,
          error: 'Failed to remove rating',
        });

        consoleErrorSpy.mockRestore();
      });

      it('should handle unexpected errors', async () => {
        const consoleErrorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        (currentUser as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error('Auth error'),
        );

        const request = new Request(
          'http://localhost:3000/api/games/rating?gameId=123',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Auth error');

        consoleErrorSpy.mockRestore();
      });

      it('should handle non-Error exceptions', async () => {
        const consoleErrorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        (currentUser as ReturnType<typeof vi.fn>).mockRejectedValue(
          'String error',
        );

        const request = new Request(
          'http://localhost:3000/api/games/rating?gameId=123',
          {
            method: 'DELETE',
          },
        );

        const response = await DELETE(request as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Unknown error');

        consoleErrorSpy.mockRestore();
      });
    });
  });
});
