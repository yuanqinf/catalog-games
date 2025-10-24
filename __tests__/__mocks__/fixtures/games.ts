import type { GameDbData } from '@/types';

export const mockGame: GameDbData = {
  id: 1,
  igdb_id: 1001,
  name: 'Test Game',
  slug: 'test-game',
  summary: 'This is a test game',
  cover_url: 'https://example.com/cover.jpg',
  banner_url: 'https://example.com/banner.jpg',
  first_release_date: '2024-01-01',
  total_rating: 85.5,
  genres: ['Action', 'Adventure'],
  platforms: ['PC', 'PlayStation 5'],
  game_engines: ['Unity'],
  game_modes: ['Single player', 'Multiplayer'],
  publishers: ['Test Publisher'],
  developers: ['Test Developer'],
  igdb_user_rating: 8.5,
  dislike_count: 100,
  updated_at: '2024-01-01T00:00:00Z',
  steam_app_id: null,
};

export const mockSearchResult = {
  id: 1,
  igdb_id: 1001,
  name: 'Test Game',
  slug: 'test-game',
  cover_url: 'https://example.com/cover.jpg',
  developers: ['Test Developer'],
};

export const mockGames: GameDbData[] = [
  mockGame,
  {
    ...mockGame,
    id: 2,
    igdb_id: 1002,
    name: 'Another Game',
    slug: 'another-game',
    dislike_count: 50,
  },
  {
    ...mockGame,
    id: 3,
    igdb_id: 1003,
    name: 'Third Game',
    slug: 'third-game',
    dislike_count: 25,
  },
];
