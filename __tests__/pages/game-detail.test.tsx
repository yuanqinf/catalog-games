import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameDetailPage from '@/app/(root)/detail/[id]/page';
import { notFound } from 'next/navigation';
import type { GameDbData, DeadGameFromAPI } from '@/types';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

// Mock ServerGameService
const mockGetGameBySlugId = vi.fn();
const mockGetDeadGames = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  ServerGameService: class MockServerGameService {
    getGameBySlugId = mockGetGameBySlugId;
    getDeadGames = mockGetDeadGames;
  },
}));

// Mock GameDetail component
vi.mock('@/components/pages/game-detail-page/game-detail', () => ({
  default: ({
    game,
    deadGame,
  }: {
    game: GameDbData;
    deadGame: DeadGameFromAPI | null;
  }) => (
    <div data-testid="game-detail">
      <h1 data-testid="game-name">{game.name}</h1>
      <div data-testid="game-slug">{game.slug}</div>
      <div data-testid="dislike-count">{game.dislike_count}</div>
      {deadGame && (
        <div data-testid="dead-game-info">
          <div data-testid="shutdown-date">{deadGame.dead_date}</div>
          <div data-testid="shutdown-reason">{deadGame.dead_status}</div>
        </div>
      )}
    </div>
  ),
}));

describe('GameDetailPage', () => {
  const mockGame: GameDbData = {
    id: 1,
    igdb_id: 1001,
    name: 'Test Game',
    slug: 'test-game',
    cover_url: 'https://example.com/cover.jpg',
    banner_url: 'https://example.com/banner.jpg',
    summary: 'This is a test game summary',
    developers: ['Test Developer'],
    platforms: ['PC', 'PS5'],
    dislike_count: 500,
  };

  const mockDeadGame: DeadGameFromAPI = {
    id: '1',
    dead_date: '2024-01-01',
    dead_status: 'Shutdown',
    user_reaction_count: 100,
    games: {
      id: 1,
      igdb_id: 1001,
      name: 'Test Game',
      slug: 'test-game',
      cover_url: 'https://example.com/cover.jpg',
      banner_url: 'https://example.com/banner.jpg',
      developers: ['Test Developer'],
      publishers: null,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Game fetching', () => {
    it('should fetch game by slug/id and render GameDetail component', async () => {
      mockGetGameBySlugId.mockResolvedValue(mockGame);
      mockGetDeadGames.mockResolvedValue([]);

      const params = Promise.resolve({ id: 'test-game' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(mockGetGameBySlugId).toHaveBeenCalledWith('test-game');
      expect(screen.getByTestId('game-detail')).toBeInTheDocument();
      expect(screen.getByTestId('game-name')).toHaveTextContent('Test Game');
      expect(screen.getByTestId('game-slug')).toHaveTextContent('test-game');
      expect(screen.getByTestId('dislike-count')).toHaveTextContent('500');
    });

    it('should call notFound when game is not found', async () => {
      mockGetGameBySlugId.mockResolvedValue(null);
      // Make notFound throw like it does in Next.js
      (notFound as any).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND');
      });

      const params = Promise.resolve({ id: 'non-existent-game' });

      await expect(async () => {
        await GameDetailPage({ params });
      }).rejects.toThrow('NEXT_NOT_FOUND');

      expect(mockGetGameBySlugId).toHaveBeenCalledWith('non-existent-game');
      expect(notFound).toHaveBeenCalled();
    });

    it('should fetch dead games list', async () => {
      mockGetGameBySlugId.mockResolvedValue(mockGame);
      mockGetDeadGames.mockResolvedValue([]);

      const params = Promise.resolve({ id: 'test-game' });
      await GameDetailPage({ params });

      expect(mockGetDeadGames).toHaveBeenCalled();
    });
  });

  describe('Dead game detection', () => {
    it('should identify and pass dead game data when game is in dead games list (by id)', async () => {
      mockGetGameBySlugId.mockResolvedValue(mockGame);
      mockGetDeadGames.mockResolvedValue([mockDeadGame]);

      const params = Promise.resolve({ id: 'test-game' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(screen.getByTestId('dead-game-info')).toBeInTheDocument();
      expect(screen.getByTestId('shutdown-date')).toHaveTextContent(
        '2024-01-01',
      );
      expect(screen.getByTestId('shutdown-reason')).toHaveTextContent(
        'Shutdown',
      );
    });

    it('should identify dead game by slug match', async () => {
      const gameWithDifferentId = { ...mockGame, id: 999 };
      const deadGameWithSlugMatch = {
        ...mockDeadGame,
        games: { ...mockGame, id: 1 }, // Different ID but same slug
      };

      mockGetGameBySlugId.mockResolvedValue(gameWithDifferentId);
      mockGetDeadGames.mockResolvedValue([deadGameWithSlugMatch]);

      const params = Promise.resolve({ id: 'test-game' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(screen.getByTestId('dead-game-info')).toBeInTheDocument();
    });

    it('should pass null for deadGame when game is not dead', async () => {
      mockGetGameBySlugId.mockResolvedValue(mockGame);
      mockGetDeadGames.mockResolvedValue([]);

      const params = Promise.resolve({ id: 'test-game' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(screen.queryByTestId('dead-game-info')).not.toBeInTheDocument();
    });

    it('should handle multiple dead games and find correct match', async () => {
      const otherDeadGame: DeadGameFromAPI = {
        id: '2',
        games: {
          id: 222,
          igdb_id: 1001,
          name: 'Test Game',
          slug: 'test-game',
          cover_url: 'https://example.com/cover.jpg',
          banner_url: 'https://example.com/banner.jpg',
          developers: ['Test Developer'],
          publishers: null,
        },
        dead_date: '2024-01-01',
        dead_status: 'Abandoned',
        user_reaction_count: 100,
      };

      const mockDeadGame: DeadGameFromAPI = {
        id: '1',
        dead_date: '2024-01-01',
        dead_status: 'Shutdown',
        user_reaction_count: 100,
        games: {
          id: 1,
          igdb_id: 1001,
          name: 'Test Game',
          slug: 'test-game',
          cover_url: 'https://example.com/cover.jpg',
          banner_url: 'https://example.com/banner.jpg',
          developers: ['Test Developer'],
          publishers: null,
        },
      };

      mockGetGameBySlugId.mockResolvedValue(mockGame);
      mockGetDeadGames.mockResolvedValue([otherDeadGame, mockDeadGame]);

      const params = Promise.resolve({ id: 'test-game' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(screen.getByTestId('dead-game-info')).toBeInTheDocument();
      expect(screen.getByTestId('shutdown-date')).toHaveTextContent(
        '2024-01-01',
      );
    });
  });

  describe('Different game scenarios', () => {
    it('should handle game with minimal data', async () => {
      const minimalGame: GameDbData = {
        id: 2,
        igdb_id: 1002,
        name: 'Minimal Game',
        slug: 'minimal-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 0,
      };

      mockGetGameBySlugId.mockResolvedValue(minimalGame);
      mockGetDeadGames.mockResolvedValue([]);

      const params = Promise.resolve({ id: 'minimal-game' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(screen.getByTestId('game-name')).toHaveTextContent('Minimal Game');
      expect(screen.getByTestId('dislike-count')).toHaveTextContent('0');
    });

    it('should handle game with full metadata', async () => {
      const fullGame: GameDbData = {
        id: 3,
        igdb_id: 1003,
        name: 'Full Game',
        slug: 'full-game',
        cover_url: 'https://example.com/cover.jpg',
        banner_url: 'https://example.com/banner.jpg',
        summary: 'Comprehensive game description',
        developers: ['Dev 1', 'Dev 2'],
        platforms: ['PC', 'PS5', 'Xbox'],
        dislike_count: 10000,
        steam_app_id: 123456,
      };

      mockGetGameBySlugId.mockResolvedValue(fullGame);
      mockGetDeadGames.mockResolvedValue([]);

      const params = Promise.resolve({ id: 'full-game' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(screen.getByTestId('game-name')).toHaveTextContent('Full Game');
      expect(screen.getByTestId('dislike-count')).toHaveTextContent('10000');
    });

    it('should handle game with null dislike count', async () => {
      const gameWithNullCount: GameDbData = {
        ...mockGame,
        dislike_count: null,
      };

      mockGetGameBySlugId.mockResolvedValue(gameWithNullCount);
      mockGetDeadGames.mockResolvedValue([]);

      const params = Promise.resolve({ id: 'test-game' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(screen.getByTestId('game-detail')).toBeInTheDocument();
    });
  });

  describe('Param variations', () => {
    it('should handle numeric id parameter', async () => {
      mockGetGameBySlugId.mockResolvedValue(mockGame);
      mockGetDeadGames.mockResolvedValue([]);

      const params = Promise.resolve({ id: '123' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(mockGetGameBySlugId).toHaveBeenCalledWith('123');
      expect(screen.getByTestId('game-detail')).toBeInTheDocument();
    });

    it('should handle slug parameter with dashes', async () => {
      mockGetGameBySlugId.mockResolvedValue(mockGame);
      mockGetDeadGames.mockResolvedValue([]);

      const params = Promise.resolve({ id: 'game-with-many-dashes' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(mockGetGameBySlugId).toHaveBeenCalledWith('game-with-many-dashes');
    });

    it('should handle slug parameter with special characters', async () => {
      const specialGame = { ...mockGame, slug: 'game_with_underscores' };
      mockGetGameBySlugId.mockResolvedValue(specialGame);
      mockGetDeadGames.mockResolvedValue([]);

      const params = Promise.resolve({ id: 'game_with_underscores' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(mockGetGameBySlugId).toHaveBeenCalledWith('game_with_underscores');
      expect(screen.getByTestId('game-slug')).toHaveTextContent(
        'game_with_underscores',
      );
    });
  });

  describe('SSR behavior', () => {
    it('should fetch data server-side before rendering', async () => {
      mockGetGameBySlugId.mockResolvedValue(mockGame);
      mockGetDeadGames.mockResolvedValue([]);

      const params = Promise.resolve({ id: 'test-game' });

      // Component is async, data fetching happens during await
      const jsx = await GameDetailPage({ params });

      // Both service calls should have been made
      expect(mockGetGameBySlugId).toHaveBeenCalled();
      expect(mockGetDeadGames).toHaveBeenCalled();

      // Data should be immediately available when rendered
      render(jsx);
      expect(screen.getByTestId('game-detail')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty dead games array', async () => {
      mockGetGameBySlugId.mockResolvedValue(mockGame);
      mockGetDeadGames.mockResolvedValue([]);

      const params = Promise.resolve({ id: 'test-game' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(screen.queryByTestId('dead-game-info')).not.toBeInTheDocument();
    });

    it('should handle undefined dead games result', async () => {
      mockGetGameBySlugId.mockResolvedValue(mockGame);
      mockGetDeadGames.mockResolvedValue(undefined);

      const params = Promise.resolve({ id: 'test-game' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(screen.queryByTestId('dead-game-info')).not.toBeInTheDocument();
    });

    it('should match dead game by ID when both ID and slug exist', async () => {
      mockGetGameBySlugId.mockResolvedValue(mockGame);
      mockGetDeadGames.mockResolvedValue([mockDeadGame]);

      const params = Promise.resolve({ id: '1' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(screen.getByTestId('dead-game-info')).toBeInTheDocument();
    });

    it('should handle game with very long name', async () => {
      const longNameGame = {
        ...mockGame,
        name: 'This is a very long game name that might cause layout issues in some scenarios but should still work correctly',
      };

      mockGetGameBySlugId.mockResolvedValue(longNameGame);
      mockGetDeadGames.mockResolvedValue([]);

      const params = Promise.resolve({ id: 'test-game' });
      const jsx = await GameDetailPage({ params });
      render(jsx);

      expect(screen.getByTestId('game-name')).toBeInTheDocument();
    });
  });
});
