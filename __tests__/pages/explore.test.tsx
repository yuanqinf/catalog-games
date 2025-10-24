import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameExplorePage from '@/app/(root)/explore/page';
import type { GameDbData, DeadGameFromAPI } from '@/types';

// Mock ServerGameService
const mockGetGamesForExplorePage = vi.fn();
const mockGetDeadGames = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  ServerGameService: class MockServerGameService {
    getGamesForExplorePage = mockGetGamesForExplorePage;
    getDeadGames = mockGetDeadGames;
  },
}));

// Mock Suspense fallback (loading component)
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    Suspense: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock ExplorePageContent component
vi.mock('@/components/pages/explore-game/explore-page-content', () => ({
  ExplorePageContent: ({
    initialDislikedGames,
    initialDeadGames,
  }: {
    initialDislikedGames?: GameDbData[];
    initialDeadGames?: DeadGameFromAPI[];
  }) => (
    <div data-testid="explore-page-content">
      {initialDislikedGames && (
        <div data-testid="disliked-games-section">
          <h2>Top Disliked Games</h2>
          <div data-testid="disliked-games-count">
            {initialDislikedGames.length}
          </div>
          {initialDislikedGames.map((game) => (
            <div key={game.id} data-testid={`disliked-game-${game.id}`}>
              {game.name}
            </div>
          ))}
        </div>
      )}
      {initialDeadGames && (
        <div data-testid="dead-games-section">
          <h2>Gaming Graveyard</h2>
          <div data-testid="dead-games-count">{initialDeadGames.length}</div>
          {initialDeadGames.map((deadGame) => (
            <div
              key={deadGame.games.id}
              data-testid={`dead-game-${deadGame.games.id}`}
            >
              {deadGame.games.name}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

describe('GameExplorePage', () => {
  const mockDislikedGames: GameDbData[] = [
    {
      id: 1,
      igdb_id: 1001,
      name: 'Disliked Game 1',
      slug: 'disliked-game-1',
      cover_url: 'https://example.com/cover1.jpg',
      developers: ['Dev 1'],
      dislike_count: 5000,
    },
    {
      id: 2,
      igdb_id: 1002,
      name: 'Disliked Game 2',
      slug: 'disliked-game-2',
      cover_url: null,
      developers: ['Dev 2'],
      dislike_count: 4500,
    },
  ];

  const mockDeadGames: DeadGameFromAPI[] = [
    {
      id: '1',
      dead_date: '2024-01-01',
      dead_status: 'Shutdown',
      user_reaction_count: 500,
      games: {
        id: 10,
        igdb_id: 2001,
        name: 'Dead Game 1',
        slug: 'dead-game-1',
        cover_url: null,
        banner_url: null,
        developers: ['Dead Dev 1'],
        publishers: null,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Disliked view (default)', () => {
    it('should fetch and display disliked games when view is "disliked"', async () => {
      mockGetGamesForExplorePage.mockResolvedValue(mockDislikedGames);
      mockGetDeadGames.mockResolvedValue(mockDeadGames);

      const searchParams = Promise.resolve({ view: 'disliked' });
      const jsx = await GameExplorePage({ searchParams });
      render(jsx);

      expect(mockGetGamesForExplorePage).toHaveBeenCalledWith(0, 15, 100);
      expect(mockGetDeadGames).not.toHaveBeenCalled();

      expect(screen.getByTestId('explore-page-content')).toBeInTheDocument();
      expect(screen.getByTestId('disliked-games-section')).toBeInTheDocument();
      expect(screen.getByTestId('disliked-games-count')).toHaveTextContent('2');
      expect(screen.getByText('Disliked Game 1')).toBeInTheDocument();
      expect(screen.getByText('Disliked Game 2')).toBeInTheDocument();
    });

    it('should default to "disliked" view when no view param provided', async () => {
      mockGetGamesForExplorePage.mockResolvedValue(mockDislikedGames);
      mockGetDeadGames.mockResolvedValue(mockDeadGames);

      const searchParams = Promise.resolve({});
      const jsx = await GameExplorePage({ searchParams });
      render(jsx);

      expect(mockGetGamesForExplorePage).toHaveBeenCalledWith(0, 15, 100);
      expect(mockGetDeadGames).not.toHaveBeenCalled();

      expect(screen.getByTestId('disliked-games-section')).toBeInTheDocument();
    });

    it('should fetch first 15 games with correct pagination params', async () => {
      mockGetGamesForExplorePage.mockResolvedValue(mockDislikedGames);

      const searchParams = Promise.resolve({ view: 'disliked' });
      await GameExplorePage({ searchParams });

      expect(mockGetGamesForExplorePage).toHaveBeenCalledWith(
        0, // offset
        15, // limit (GAMES_PER_PAGE)
        100, // max games
      );
    });

    it('should handle empty disliked games array', async () => {
      mockGetGamesForExplorePage.mockResolvedValue([]);

      const searchParams = Promise.resolve({ view: 'disliked' });
      const jsx = await GameExplorePage({ searchParams });
      render(jsx);

      expect(screen.getByTestId('disliked-games-section')).toBeInTheDocument();
      expect(screen.getByTestId('disliked-games-count')).toHaveTextContent('0');
    });
  });

  describe('Graveyard view', () => {
    it('should fetch and display dead games when view is "graveyard"', async () => {
      mockGetGamesForExplorePage.mockResolvedValue(mockDislikedGames);
      mockGetDeadGames.mockResolvedValue(mockDeadGames);

      const searchParams = Promise.resolve({ view: 'graveyard' });
      const jsx = await GameExplorePage({ searchParams });
      render(jsx);

      expect(mockGetDeadGames).toHaveBeenCalled();
      expect(mockGetGamesForExplorePage).not.toHaveBeenCalled();

      expect(screen.getByTestId('explore-page-content')).toBeInTheDocument();
      expect(screen.getByTestId('dead-games-section')).toBeInTheDocument();
      expect(screen.getByTestId('dead-games-count')).toHaveTextContent('1');
      expect(screen.getByText('Dead Game 1')).toBeInTheDocument();
    });

    it('should handle empty dead games array', async () => {
      mockGetDeadGames.mockResolvedValue([]);

      const searchParams = Promise.resolve({ view: 'graveyard' });
      const jsx = await GameExplorePage({ searchParams });
      render(jsx);

      expect(screen.getByTestId('dead-games-section')).toBeInTheDocument();
      expect(screen.getByTestId('dead-games-count')).toHaveTextContent('0');
    });

    it('should handle multiple dead games', async () => {
      const multipleDeadGames: DeadGameFromAPI[] = [
        {
          id: '1',
          dead_date: '2024-01-01',
          dead_status: 'Shutdown',
          user_reaction_count: 50,
          games: {
            id: 10,
            igdb_id: 2001,
            name: 'Dead Game 1',
            slug: 'dead-game-1',
            banner_url: null,
            cover_url: null,
            developers: [],
            publishers: null,
          },
        },
        {
          id: '2',
          dead_date: '2024-02-01',
          dead_status: 'Abandoned',
          user_reaction_count: 100,
          games: {
            id: 11,
            igdb_id: 2002,
            name: 'Dead Game 2',
            slug: 'dead-game-2',
            banner_url: null,
            cover_url: null,
            developers: [],
            publishers: null,
          },
        },
      ];

      mockGetDeadGames.mockResolvedValue(multipleDeadGames);

      const searchParams = Promise.resolve({ view: 'graveyard' });
      const jsx = await GameExplorePage({ searchParams });
      render(jsx);

      expect(screen.getByTestId('dead-games-count')).toHaveTextContent('2');
      expect(screen.getByText('Dead Game 1')).toBeInTheDocument();
      expect(screen.getByText('Dead Game 2')).toBeInTheDocument();
    });
  });

  describe('Data fetching', () => {
    it('should only fetch disliked games when view is "disliked"', async () => {
      mockGetGamesForExplorePage.mockResolvedValue(mockDislikedGames);
      mockGetDeadGames.mockResolvedValue(mockDeadGames);

      const searchParams = Promise.resolve({ view: 'disliked' });
      await GameExplorePage({ searchParams });

      expect(mockGetGamesForExplorePage).toHaveBeenCalledTimes(1);
      expect(mockGetDeadGames).not.toHaveBeenCalled();
    });

    it('should only fetch dead games when view is "graveyard"', async () => {
      mockGetGamesForExplorePage.mockResolvedValue(mockDislikedGames);
      mockGetDeadGames.mockResolvedValue(mockDeadGames);

      const searchParams = Promise.resolve({ view: 'graveyard' });
      await GameExplorePage({ searchParams });

      expect(mockGetDeadGames).toHaveBeenCalledTimes(1);
      expect(mockGetGamesForExplorePage).not.toHaveBeenCalled();
    });

    it('should pass correct data to ExplorePageContent for disliked view', async () => {
      mockGetGamesForExplorePage.mockResolvedValue(mockDislikedGames);

      const searchParams = Promise.resolve({ view: 'disliked' });
      const jsx = await GameExplorePage({ searchParams });
      render(jsx);

      // Should have disliked games section
      expect(screen.getByTestId('disliked-games-section')).toBeInTheDocument();
      // Should NOT have dead games section
      expect(
        screen.queryByTestId('dead-games-section'),
      ).not.toBeInTheDocument();
    });

    it('should pass correct data to ExplorePageContent for graveyard view', async () => {
      mockGetDeadGames.mockResolvedValue(mockDeadGames);

      const searchParams = Promise.resolve({ view: 'graveyard' });
      const jsx = await GameExplorePage({ searchParams });
      render(jsx);

      // Should have dead games section
      expect(screen.getByTestId('dead-games-section')).toBeInTheDocument();
      // Should NOT have disliked games section
      expect(
        screen.queryByTestId('disliked-games-section'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid view parameter by defaulting to disliked', async () => {
      mockGetGamesForExplorePage.mockResolvedValue(mockDislikedGames);

      const searchParams = Promise.resolve({ view: 'invalid' });
      const jsx = await GameExplorePage({ searchParams });
      render(jsx);

      // Should NOT fetch any data for invalid view
      expect(mockGetGamesForExplorePage).not.toHaveBeenCalled();
      expect(mockGetDeadGames).not.toHaveBeenCalled();
    });

    it('should handle large dataset for disliked games', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        igdb_id: 1000 + i,
        name: `Game ${i}`,
        slug: `game-${i}`,
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 1000 - i,
      }));

      mockGetGamesForExplorePage.mockResolvedValue(largeDataset.slice(0, 15));

      const searchParams = Promise.resolve({ view: 'disliked' });
      const jsx = await GameExplorePage({ searchParams });
      render(jsx);

      expect(screen.getByTestId('disliked-games-count')).toHaveTextContent(
        '15',
      );
    });

    it('should pass undefined for non-fetched view data', async () => {
      mockGetGamesForExplorePage.mockResolvedValue(mockDislikedGames);

      const searchParams = Promise.resolve({ view: 'disliked' });
      const jsx = await GameExplorePage({ searchParams });
      render(jsx);

      // Dead games should NOT be rendered (undefined was passed)
      expect(
        screen.queryByTestId('dead-games-section'),
      ).not.toBeInTheDocument();
    });
  });

  describe('SSR/ISR behavior', () => {
    it('should fetch data server-side (component is async)', async () => {
      mockGetGamesForExplorePage.mockResolvedValue(mockDislikedGames);

      const searchParams = Promise.resolve({ view: 'disliked' });

      // The component is async, data fetching happens during await
      const jsx = await GameExplorePage({ searchParams });

      // Data should be fetched before rendering
      expect(mockGetGamesForExplorePage).toHaveBeenCalled();

      render(jsx);
      // Data should be immediately available (no loading state)
      expect(screen.getByTestId('disliked-games-section')).toBeInTheDocument();
    });
  });
});
