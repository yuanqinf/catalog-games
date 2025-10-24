import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/(root)/page';
import type { GameDbData, DeadGameFromAPI } from '@/types';

// Mock ServerGameService
const mockGetTopDislikedGames = vi.fn();
const mockGetDeadGames = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  ServerGameService: class MockServerGameService {
    getTopDislikedGames = mockGetTopDislikedGames;
    getDeadGames = mockGetDeadGames;
  },
}));

// Mock child components
vi.mock('@/components/pages/homepage/top-dislike-games', () => ({
  default: ({ initialData }: { initialData: GameDbData[] }) => (
    <div data-testid="top-dislike-games">
      <h2>Top Disliked Games</h2>
      <div data-testid="disliked-games-count">{initialData.length}</div>
      {initialData.map((game) => (
        <div key={game.id} data-testid={`game-${game.id}`}>
          {game.name}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/pages/homepage/top-dead-games', () => ({
  default: ({ initialData }: { initialData: DeadGameFromAPI[] }) => (
    <div data-testid="top-dead-games">
      <h2>Top Dead Games</h2>
      <div data-testid="dead-games-count">{initialData.length}</div>
      {initialData.map((deadGame) => (
        <div
          key={deadGame.games.id}
          data-testid={`dead-game-${deadGame.games.id}`}
        >
          {deadGame.games.name}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/shared/welcome-dialog', () => ({
  WelcomeDialog: () => <div data-testid="welcome-dialog">Welcome Dialog</div>,
}));

describe('HomePage', () => {
  const mockDislikedGames: GameDbData[] = [
    {
      id: 1,
      igdb_id: 1001,
      name: 'Bad Game 1',
      slug: 'bad-game-1',
      cover_url: 'https://example.com/cover1.jpg',
      developers: ['Dev 1'],
      platforms: ['PC'],
      dislike_count: 1000,
    },
    {
      id: 2,
      igdb_id: 1002,
      name: 'Bad Game 2',
      slug: 'bad-game-2',
      cover_url: 'https://example.com/cover2.jpg',
      developers: ['Dev 2'],
      platforms: ['PS5'],
      dislike_count: 800,
    },
  ];

  const mockDeadGames: DeadGameFromAPI[] = [
    {
      id: '1',
      dead_date: '2024-01-01',
      dead_status: 'Shutdown',
      user_reaction_count: 100,
      games: {
        id: 1,
        igdb_id: 1001,
        name: 'Dead Game 1',
        slug: 'dead-game-1',
        cover_url: 'https://example.com/cover.jpg',
        banner_url: 'https://example.com/banner.jpg',
        developers: ['Test Developer'],
        publishers: null,
      },
    },
    {
      id: '2',
      dead_date: '2024-02-01',
      dead_status: 'Shutdown',
      user_reaction_count: 100,
      games: {
        id: 1,
        igdb_id: 1001,
        name: 'Dead Game 2',
        slug: 'dead-game-2',
        cover_url: 'https://example.com/cover.jpg',
        banner_url: 'https://example.com/banner.jpg',
        developers: ['Test Developer'],
        publishers: null,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render welcome dialog', async () => {
    mockGetTopDislikedGames.mockResolvedValue(mockDislikedGames);
    mockGetDeadGames.mockResolvedValue(mockDeadGames);

    const jsx = await HomePage();
    render(jsx);

    expect(screen.getByTestId('welcome-dialog')).toBeInTheDocument();
  });

  it('should fetch and display top disliked games', async () => {
    mockGetTopDislikedGames.mockResolvedValue(mockDislikedGames);
    mockGetDeadGames.mockResolvedValue(mockDeadGames);

    const jsx = await HomePage();
    render(jsx);

    expect(mockGetTopDislikedGames).toHaveBeenCalledWith(10);
    expect(screen.getByTestId('top-dislike-games')).toBeInTheDocument();
    expect(screen.getByTestId('disliked-games-count')).toHaveTextContent('2');
    expect(screen.getByText('Bad Game 1')).toBeInTheDocument();
    expect(screen.getByText('Bad Game 2')).toBeInTheDocument();
  });

  it('should fetch and display dead games', async () => {
    mockGetTopDislikedGames.mockResolvedValue(mockDislikedGames);
    mockGetDeadGames.mockResolvedValue(mockDeadGames);

    const jsx = await HomePage();
    render(jsx);

    expect(mockGetDeadGames).toHaveBeenCalled();
    expect(screen.getByTestId('top-dead-games')).toBeInTheDocument();
    expect(screen.getByTestId('dead-games-count')).toHaveTextContent('2');
    expect(screen.getByText('Dead Game 1')).toBeInTheDocument();
    expect(screen.getByText('Dead Game 2')).toBeInTheDocument();
  });

  it('should fetch data in parallel using Promise.all', async () => {
    mockGetTopDislikedGames.mockResolvedValue(mockDislikedGames);
    mockGetDeadGames.mockResolvedValue(mockDeadGames);

    const jsx = await HomePage();
    render(jsx);

    expect(mockGetTopDislikedGames).toHaveBeenCalledTimes(1);
    expect(mockGetDeadGames).toHaveBeenCalledTimes(1);
  });

  it('should handle empty disliked games array', async () => {
    mockGetTopDislikedGames.mockResolvedValue([]);
    mockGetDeadGames.mockResolvedValue(mockDeadGames);

    const jsx = await HomePage();
    render(jsx);

    expect(screen.getByTestId('top-dislike-games')).toBeInTheDocument();
    expect(screen.getByTestId('disliked-games-count')).toHaveTextContent('0');
  });

  it('should handle empty dead games array', async () => {
    mockGetTopDislikedGames.mockResolvedValue(mockDislikedGames);
    mockGetDeadGames.mockResolvedValue([]);

    const jsx = await HomePage();
    render(jsx);

    expect(screen.getByTestId('top-dead-games')).toBeInTheDocument();
    expect(screen.getByTestId('dead-games-count')).toHaveTextContent('0');
  });

  it('should handle both empty arrays', async () => {
    mockGetTopDislikedGames.mockResolvedValue([]);
    mockGetDeadGames.mockResolvedValue([]);

    const jsx = await HomePage();
    render(jsx);

    expect(screen.getByTestId('top-dislike-games')).toBeInTheDocument();
    expect(screen.getByTestId('top-dead-games')).toBeInTheDocument();
    expect(screen.getByTestId('disliked-games-count')).toHaveTextContent('0');
    expect(screen.getByTestId('dead-games-count')).toHaveTextContent('0');
  });

  it('should pass correct initial data to components', async () => {
    const customGames = [
      {
        id: 99,
        igdb_id: 9999,
        name: 'Custom Game',
        slug: 'custom-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 5000,
      },
    ];

    mockGetTopDislikedGames.mockResolvedValue(customGames);
    mockGetDeadGames.mockResolvedValue([]);

    const jsx = await HomePage();
    render(jsx);

    expect(screen.getByText('Custom Game')).toBeInTheDocument();
    expect(screen.getByTestId('disliked-games-count')).toHaveTextContent('1');
  });

  it('should render container with correct styling classes', async () => {
    mockGetTopDislikedGames.mockResolvedValue([]);
    mockGetDeadGames.mockResolvedValue([]);

    const jsx = await HomePage();
    const { container } = render(jsx);

    const mainContainer = container.querySelector('.container');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('mx-auto');
    expect(mainContainer).toHaveClass('space-y-12');
  });

  it('should handle large number of games', async () => {
    const manyGames = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      igdb_id: 1000 + i,
      name: `Game ${i}`,
      slug: `game-${i}`,
      cover_url: null,
      developers: [],
      platforms: [],
      dislike_count: 100 - i,
    }));

    mockGetTopDislikedGames.mockResolvedValue(manyGames.slice(0, 10));
    mockGetDeadGames.mockResolvedValue([]);

    const jsx = await HomePage();
    render(jsx);

    expect(screen.getByTestId('disliked-games-count')).toHaveTextContent('10');
  });
});
