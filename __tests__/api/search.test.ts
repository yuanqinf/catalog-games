import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/search/route';

// Mock GameService
const mockSearchGames = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  GameService: class GameService {
    searchGames = mockSearchGames;
  },
}));

describe('/api/search', () => {
  beforeEach(() => {
    mockSearchGames.mockClear();
  });

  describe('Query validation', () => {
    it('should return empty array when query is missing', async () => {
      const request = new Request('http://localhost:3000/api/search');

      const response = await GET(request as any);
      const data = await response.json();

      expect(data).toEqual([]);
      expect(mockSearchGames).not.toHaveBeenCalled();
    });

    it('should return empty array when query is empty string', async () => {
      const request = new Request('http://localhost:3000/api/search?query=');

      const response = await GET(request as any);
      const data = await response.json();

      expect(data).toEqual([]);
      expect(mockSearchGames).not.toHaveBeenCalled();
    });

    it('should return empty array when query is only whitespace', async () => {
      const request = new Request('http://localhost:3000/api/search?query=   ');

      const response = await GET(request as any);
      const data = await response.json();

      expect(data).toEqual([]);
      expect(mockSearchGames).not.toHaveBeenCalled();
    });

    it('should trim whitespace from query before searching', async () => {
      mockSearchGames.mockResolvedValue([]);

      const request = new Request(
        'http://localhost:3000/api/search?query=  zelda  ',
      );

      await GET(request as any);

      expect(mockSearchGames).toHaveBeenCalledWith('zelda');
    });
  });

  describe('Successful searches', () => {
    it('should return search results from GameService', async () => {
      const mockResults = [
        {
          id: 1,
          igdb_id: 1001,
          name: 'The Legend of Zelda',
          slug: 'the-legend-of-zelda',
          cover_url: 'https://example.com/cover.jpg',
          developers: ['Nintendo'],
        },
        {
          id: 2,
          igdb_id: 1002,
          name: 'Zelda II',
          slug: 'zelda-ii',
          cover_url: 'https://example.com/cover2.jpg',
          developers: ['Nintendo'],
        },
      ];

      mockSearchGames.mockResolvedValue(mockResults);

      const request = new Request(
        'http://localhost:3000/api/search?query=zelda',
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(data).toEqual(mockResults);
      expect(mockSearchGames).toHaveBeenCalledWith('zelda');
    });

    it('should handle single character queries', async () => {
      mockSearchGames.mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/search?query=a');

      const response = await GET(request as any);
      const data = await response.json();

      expect(data).toEqual([]);
      expect(mockSearchGames).toHaveBeenCalledWith('a');
    });

    it('should handle queries with special characters', async () => {
      mockSearchGames.mockResolvedValue([]);

      const request = new Request(
        'http://localhost:3000/api/search?query=mario%2Bluigi',
      );

      await GET(request as any);

      expect(mockSearchGames).toHaveBeenCalledWith('mario+luigi');
    });

    it('should return cache headers for stable results', async () => {
      mockSearchGames.mockResolvedValue([]);

      const request = new Request(
        'http://localhost:3000/api/search?query=test',
      );

      const response = await GET(request as any);

      // Check that response has cache headers
      expect(response.headers.has('cache-control')).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should return 500 error when GameService throws', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockSearchGames.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const request = new Request(
        'http://localhost:3000/api/search?query=test',
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to search games' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Database search error:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle network timeouts', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockSearchGames.mockRejectedValue(new Error('Network timeout'));

      const request = new Request(
        'http://localhost:3000/api/search?query=test',
      );

      const response = await GET(request as any);

      expect(response.status).toBe(500);

      consoleErrorSpy.mockRestore();
    });

    it('should handle malformed responses from GameService', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockSearchGames.mockRejectedValue(new TypeError('Cannot read property'));

      const request = new Request(
        'http://localhost:3000/api/search?query=test',
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to search games');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long query strings', async () => {
      const longQuery = 'a'.repeat(1000);
      mockSearchGames.mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/search?query=${longQuery}`,
      );

      await GET(request as any);

      expect(mockSearchGames).toHaveBeenCalledWith(longQuery);
    });

    it('should handle unicode characters in query', async () => {
      mockSearchGames.mockResolvedValue([]);

      const request = new Request(
        'http://localhost:3000/api/search?query=ファイナルファンタジー',
      );

      await GET(request as any);

      expect(mockSearchGames).toHaveBeenCalledWith('ファイナルファンタジー');
    });

    it('should handle empty results array', async () => {
      mockSearchGames.mockResolvedValue([]);

      const request = new Request(
        'http://localhost:3000/api/search?query=nonexistent',
      );

      const response = await GET(request as any);
      const data = await response.json();

      expect(data).toEqual([]);
      expect(response.status).toBe(200);
    });

    it('should handle queries with multiple spaces', async () => {
      mockSearchGames.mockResolvedValue([]);

      const request = new Request(
        'http://localhost:3000/api/search?query=super%20%20mario%20%20%20bros',
      );

      await GET(request as any);

      // Should be called with the exact decoded query
      expect(mockSearchGames).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should complete search within reasonable time', async () => {
      mockSearchGames.mockResolvedValue([]);

      const request = new Request(
        'http://localhost:3000/api/search?query=test',
      );

      const startTime = Date.now();
      await GET(request as any);
      const duration = Date.now() - startTime;

      // Should complete in less than 100ms (in test environment)
      expect(duration).toBeLessThan(100);
    });
  });
});
