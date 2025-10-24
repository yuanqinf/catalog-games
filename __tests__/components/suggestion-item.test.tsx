import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuggestionItem } from '@/components/shared/search/suggestion-item';
import { GameDbData, IgdbGame } from '@/types';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => <img src={src} alt={alt} className={className} />,
}));

// Mock @number-flow/react
vi.mock('@number-flow/react', () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

// Mock i18n
vi.mock('@/lib/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        search_rip: 'RIP',
        search_be_first_to_dislike: 'Be first to dislike',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock CommandItem
vi.mock('@/components/ui/command', () => ({
  CommandItem: ({
    children,
    onSelect,
    className,
  }: {
    children: React.ReactNode;
    onSelect: () => void;
    className?: string;
  }) => (
    <div
      data-testid="command-item"
      onClick={onSelect}
      className={className}
      role="option"
    >
      {children}
    </div>
  ),
}));

describe('SuggestionItem', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  describe('Game items (Supabase games)', () => {
    it('should render game with cover image', () => {
      const game: GameDbData = {
        id: 1,
        igdb_id: 1001,
        name: 'The Legend of Zelda',
        slug: 'the-legend-of-zelda',
        cover_url: 'https://example.com/zelda.jpg',
        developers: ['Nintendo'],
        dislike_count: 150,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.getByAltText('The Legend of Zelda')).toBeInTheDocument();
      expect(screen.getByText('The Legend of Zelda')).toBeInTheDocument();
      expect(screen.getByText('Nintendo')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should render game without cover using Gamepad icon', () => {
      const game: GameDbData = {
        id: 2,
        igdb_id: 1002,
        name: 'Test Game',
        slug: 'test-game',
        cover_url: null,
        developers: ['Test Dev'],
        dislike_count: 0,
      };

      const { container } = render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.queryByAltText('Test Game')).not.toBeInTheDocument();
      // Check for the Gamepad icon container
      const iconContainer = container.querySelector('.bg-zinc-800');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render game with developer name', () => {
      const game: GameDbData = {
        id: 3,
        igdb_id: 1003,
        name: 'Final Fantasy VII',
        slug: 'final-fantasy-vii',
        cover_url: 'https://example.com/ff7.jpg',
        developers: ['Square Enix', 'Sony'],
        dislike_count: 50,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      // Should show first developer
      expect(screen.getByText('Square Enix')).toBeInTheDocument();
      expect(screen.queryByText('Sony')).not.toBeInTheDocument();
    });

    it('should render game without developer', () => {
      const game: GameDbData = {
        id: 4,
        igdb_id: 1004,
        name: 'Unknown Game',
        slug: 'unknown-game',
        cover_url: null,
        developers: [],
        dislike_count: 0,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.getByText('Unknown Game')).toBeInTheDocument();
      // Should still show "Be first to dislike" button but no developer text
      expect(screen.getByText('Be first to dislike')).toBeInTheDocument();
      // Developer text is shown in a separate span - verify game name is the only text in the flex-col
      const gameNameElement = screen.getByText('Unknown Game');
      expect(gameNameElement.parentElement?.children).toHaveLength(1);
    });

    it('should show dislike count when > 0', () => {
      const game: GameDbData = {
        id: 5,
        igdb_id: 1005,
        name: 'Game With Dislikes',
        slug: 'game-with-dislikes',
        cover_url: null,
        developers: ['Dev'],
        dislike_count: 999,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('should show "Be first to dislike" when dislike count is 0', () => {
      const game: GameDbData = {
        id: 6,
        igdb_id: 1006,
        name: 'New Game',
        slug: 'new-game',
        cover_url: null,
        developers: ['Dev'],
        dislike_count: 0,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.getByText('Be first to dislike')).toBeInTheDocument();
    });

    it('should show "Be first to dislike" when dislike count is null', () => {
      const game: GameDbData = {
        id: 7,
        igdb_id: 1007,
        name: 'Game Without Count',
        slug: 'game-without-count',
        cover_url: null,
        developers: ['Dev'],
        dislike_count: null,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.getByText('Be first to dislike')).toBeInTheDocument();
    });

    it('should call onSelect when clicked', async () => {
      const user = userEvent.setup();
      const game: GameDbData = {
        id: 8,
        igdb_id: 1008,
        name: 'Clickable Game',
        slug: 'clickable-game',
        cover_url: null,
        developers: ['Dev'],
        dislike_count: 10,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      const item = screen.getByTestId('command-item');
      await user.click(item);

      expect(mockOnSelect).toHaveBeenCalledWith(game);
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dead games', () => {
    it('should show ghost count for dead game', () => {
      const game: GameDbData = {
        id: 9,
        igdb_id: 1009,
        name: 'Dead Game',
        slug: 'dead-game',
        cover_url: null,
        developers: ['Dev'],
        dislike_count: 100,
        is_dead: true,
        ghost_count: 250,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      // Should show ghost count, NOT dislike count
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.queryByText('100')).not.toBeInTheDocument();
    });

    it('should show "RIP" for dead game with no ghost count', () => {
      const game: GameDbData = {
        id: 10,
        igdb_id: 1010,
        name: 'Dead Game No Ghosts',
        slug: 'dead-game-no-ghosts',
        cover_url: null,
        developers: ['Dev'],
        dislike_count: 50,
        is_dead: true,
        ghost_count: 0,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.getByText('RIP')).toBeInTheDocument();
      expect(screen.queryByText('50')).not.toBeInTheDocument();
    });

    it('should show "RIP" for dead game with null ghost count', () => {
      const game: GameDbData = {
        id: 11,
        igdb_id: 1011,
        name: 'Dead Game Null Ghosts',
        slug: 'dead-game-null-ghosts',
        cover_url: null,
        developers: ['Dev'],
        dislike_count: 75,
        is_dead: true,
        ghost_count: null,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.getByText('RIP')).toBeInTheDocument();
    });
  });

  describe('IGDB games (from API)', () => {
    it('should extract developer from involved_companies', () => {
      const game: IgdbGame = {
        id: 2001,
        name: 'IGDB Game',
        slug: 'igdb-game',
        involved_companies: [
          {
            developer: true,
            company: { name: 'IGDB Dev' },
          },
        ],
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.getByText('IGDB Dev')).toBeInTheDocument();
    });

    it('should use first company when no developer role specified', () => {
      const game: IgdbGame = {
        id: 2002,
        name: 'IGDB Game 2',
        slug: 'igdb-game-2',
        involved_companies: [
          {
            developer: false,
            company: { name: 'Publisher Z' },
          },
          {
            developer: false,
            company: { name: 'Company A' },
          },
        ],
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      // Should sort alphabetically and use first
      expect(screen.getByText('Company A')).toBeInTheDocument();
    });

    it('should handle IGDB game with no involved_companies', () => {
      const game: IgdbGame = {
        id: 2003,
        name: 'IGDB Game No Companies',
        slug: 'igdb-game-no-companies',
        involved_companies: [],
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.getByText('IGDB Game No Companies')).toBeInTheDocument();
      // No developer should be shown
    });

    it('should show Gamepad icon for IGDB games (no cover_url)', () => {
      const game: IgdbGame = {
        id: 2004,
        name: 'IGDB Game',
        slug: 'igdb-game',
        involved_companies: [],
      };

      const { container } = render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      // IGDB games don't have cover_url, should show icon
      const iconContainer = container.querySelector('.bg-zinc-800');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('History mode', () => {
    it('should not show counts for history items', () => {
      const game: GameDbData = {
        id: 12,
        igdb_id: 1012,
        name: 'History Game',
        slug: 'history-game',
        cover_url: null,
        developers: ['Dev'],
        dislike_count: 500,
      };

      render(
        <SuggestionItem
          item={game}
          onSelect={mockOnSelect}
          isGame={true}
          isHistory={true}
        />,
      );

      expect(screen.getByText('History Game')).toBeInTheDocument();
      expect(screen.queryByText('500')).not.toBeInTheDocument();
      expect(screen.queryByText('Be first to dislike')).not.toBeInTheDocument();
    });

    it('should not show ghost count for dead game in history', () => {
      const game: GameDbData = {
        id: 13,
        igdb_id: 1013,
        name: 'Dead History Game',
        slug: 'dead-history-game',
        cover_url: null,
        developers: ['Dev'],
        dislike_count: 100,
        is_dead: true,
        ghost_count: 300,
      };

      render(
        <SuggestionItem
          item={game}
          onSelect={mockOnSelect}
          isGame={true}
          isHistory={true}
        />,
      );

      expect(screen.queryByText('300')).not.toBeInTheDocument();
      expect(screen.queryByText('RIP')).not.toBeInTheDocument();
    });
  });

  describe('Simple text items', () => {
    it('should render simple text without tag', () => {
      const item = { text: 'Search term' };

      render(<SuggestionItem item={item} onSelect={mockOnSelect} />);

      expect(screen.getByText('Search term')).toBeInTheDocument();
    });

    it('should render simple text with tag', () => {
      const item = { text: 'Recent search', tag: 'History' };

      render(<SuggestionItem item={item} onSelect={mockOnSelect} />);

      expect(screen.getByText('Recent search')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
    });

    it('should call onSelect with text when clicked', async () => {
      const user = userEvent.setup();
      const item = { text: 'Clickable text' };

      render(<SuggestionItem item={item} onSelect={mockOnSelect} />);

      const commandItem = screen.getByTestId('command-item');
      await user.click(commandItem);

      expect(mockOnSelect).toHaveBeenCalledWith('Clickable text');
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle game with empty string developer', () => {
      const game: GameDbData = {
        id: 14,
        igdb_id: 1014,
        name: 'Game Empty Dev',
        slug: 'game-empty-dev',
        cover_url: null,
        developers: [''],
        dislike_count: 0,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.getByText('Game Empty Dev')).toBeInTheDocument();
      // Empty string developer should not render visible text
    });

    it('should handle very long game names', () => {
      const longName =
        'Super Ultra Mega Awesome Game with an Extremely Long Name That Should Truncate';
      const game: GameDbData = {
        id: 15,
        igdb_id: 1015,
        name: longName,
        slug: 'long-name-game',
        cover_url: null,
        developers: ['Dev'],
        dislike_count: 10,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
      expect(screen.getByText(longName)).toHaveClass('truncate');
    });

    it('should handle very long developer names', () => {
      const longDevName =
        'Super Long Developer Company Name That Should Also Truncate';
      const game: GameDbData = {
        id: 16,
        igdb_id: 1016,
        name: 'Game',
        slug: 'game',
        cover_url: null,
        developers: [longDevName],
        dislike_count: 0,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.getByText(longDevName)).toBeInTheDocument();
      expect(screen.getByText(longDevName)).toHaveClass('truncate');
    });

    it('should handle large dislike counts', () => {
      const game: GameDbData = {
        id: 17,
        igdb_id: 1017,
        name: 'Very Disliked Game',
        slug: 'very-disliked-game',
        cover_url: null,
        developers: ['Dev'],
        dislike_count: 9999999,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.getByText('9999999')).toBeInTheDocument();
    });

    it('should handle large ghost counts', () => {
      const game: GameDbData = {
        id: 18,
        igdb_id: 1018,
        name: 'Very Dead Game',
        slug: 'very-dead-game',
        cover_url: null,
        developers: ['Dev'],
        dislike_count: 0,
        is_dead: true,
        ghost_count: 8888888,
      };

      render(
        <SuggestionItem item={game} onSelect={mockOnSelect} isGame={true} />,
      );

      expect(screen.getByText('8888888')).toBeInTheDocument();
    });
  });
});
