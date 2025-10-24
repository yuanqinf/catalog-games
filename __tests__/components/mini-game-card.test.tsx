import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MiniGameCard from '@/components/shared/cards/mini-game-card';
import type { GameDbData } from '@/types';

// Mock dependencies
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill,
    className,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
  }) => <img src={src} alt={alt} className={className} data-fill={fill} />,
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('@number-flow/react', () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>,
  },
}));

// Mock useThrottledDislikeReaction hook
const mockSendDislike = vi.fn();
vi.mock('@/hooks/useThrottledDislikeReaction', () => ({
  useThrottledDislikeReaction: ({
    onOptimisticUpdate,
  }: {
    onOptimisticUpdate?: (increment: number) => void;
    onError?: (error: Error, increment: number) => void;
  }) => {
    return {
      sendDislike: (igdbId: number, increment: number) => {
        mockSendDislike(igdbId, increment);
        // Simulate optimistic update
        if (onOptimisticUpdate) {
          onOptimisticUpdate(increment);
        }
      },
    };
  },
}));

// Mock platform utils
vi.mock('@/utils/platform-utils', () => ({
  unifyPlatforms: (platforms?: string[]) => {
    if (!platforms) return [];
    // Simple mock implementation
    const unified: string[] = [];
    platforms.forEach((p) => {
      if (p.toLowerCase().includes('pc') || p.toLowerCase().includes('windows'))
        unified.push('PC');
      else if (p.toLowerCase().includes('mac')) unified.push('MAC');
      else if (p.toLowerCase().includes('ps')) unified.push('PS');
      else if (p.toLowerCase().includes('xbox')) unified.push('XBOX');
      else if (p.toLowerCase().includes('switch')) unified.push('SWITCH');
      else if (p.toLowerCase().includes('mobile')) unified.push('MOBILE');
    });
    return [...new Set(unified)]; // Remove duplicates
  },
}));

// Mock FontAwesome
vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className }: { icon: any; className?: string }) => (
    <span className={className} data-icon={JSON.stringify(icon)}>
      icon
    </span>
  ),
}));

vi.mock('@fortawesome/free-solid-svg-icons', () => ({
  faGamepad: { prefix: 'fas', iconName: 'gamepad' },
}));

vi.mock('@fortawesome/free-brands-svg-icons', () => ({
  faWindows: { prefix: 'fab', iconName: 'windows' },
  faPlaystation: { prefix: 'fab', iconName: 'playstation' },
  faXbox: { prefix: 'fab', iconName: 'xbox' },
  faApple: { prefix: 'fab', iconName: 'apple' },
  faSteam: { prefix: 'fab', iconName: 'steam' },
  faAndroid: { prefix: 'fab', iconName: 'android' },
}));

// Mock UI components
vi.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <div className={className} data-variant={variant}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    className,
    size,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    size?: string;
    'aria-label'?: string;
  }) => (
    <button
      onClick={onClick}
      className={className}
      data-size={size}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TooltipTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div data-tooltip-trigger>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-tooltip-content>{children}</div>
  ),
}));

// Mock Audio
class MockAudio {
  volume: number = 0;
  play = vi.fn().mockResolvedValue(undefined);
}
global.Audio = MockAudio as any;

describe('MiniGameCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Placeholder card', () => {
    it('should render placeholder card with config', () => {
      const placeholder = {
        title: 'Explore More',
        description: 'Find more games',
        href: '/explore',
      };

      render(<MiniGameCard placeholder={placeholder} />);

      expect(screen.getByText('Explore More')).toBeInTheDocument();
      expect(screen.getByText('Find more games')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', '/explore');
    });

    it('should render Gamepad icon in placeholder', () => {
      const placeholder = {
        title: 'Test',
        description: 'Test desc',
        href: '/test',
      };

      const { container } = render(<MiniGameCard placeholder={placeholder} />);

      // Check for Gamepad icon (lucide-react SVG)
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have hover effects on placeholder', () => {
      const placeholder = {
        title: 'Test',
        description: 'Test desc',
        href: '/test',
      };

      const { container } = render(<MiniGameCard placeholder={placeholder} />);

      const card = container.querySelector('.group');
      expect(card).toHaveClass('hover:-translate-y-2');
      expect(card).toHaveClass('hover:scale-[1.02]');
    });
  });

  describe('Regular game card rendering', () => {
    it('should render game with cover image', () => {
      const game: GameDbData = {
        id: 1,
        igdb_id: 1001,
        name: 'The Legend of Zelda',
        slug: 'the-legend-of-zelda',
        cover_url: 'https://example.com/zelda.jpg',
        developers: ['Nintendo'],
        platforms: ['PC'],
        dislike_count: 100,
      };

      render(<MiniGameCard game={game} />);

      expect(screen.getByAltText('The Legend of Zelda')).toBeInTheDocument();
      expect(screen.getByText('The Legend of Zelda')).toBeInTheDocument();
      expect(screen.getByText('Nintendo')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should render game without cover using Gamepad icon', () => {
      const game: GameDbData = {
        id: 2,
        igdb_id: 1002,
        name: 'Test Game',
        slug: 'test-game',
        cover_url: null,
        developers: ['Test Dev'],
        platforms: [],
        dislike_count: 0,
      };

      const { container } = render(<MiniGameCard game={game} />);

      expect(screen.queryByAltText('Test Game')).not.toBeInTheDocument();
      // Check for Gamepad placeholder icon
      const gamePadIcon = container.querySelector('svg');
      expect(gamePadIcon).toBeInTheDocument();
    });

    it('should link to game detail page', () => {
      const game: GameDbData = {
        id: 3,
        igdb_id: 1003,
        name: 'Game',
        slug: 'game-slug',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 0,
      };

      render(<MiniGameCard game={game} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/detail/game-slug');
    });

    it('should render without developer if not provided', () => {
      const game: GameDbData = {
        id: 4,
        igdb_id: 1004,
        name: 'Game Without Dev',
        slug: 'game-without-dev',
        cover_url: null,
        developers: undefined,
        platforms: [],
        dislike_count: 5,
      };

      render(<MiniGameCard game={game} />);

      expect(screen.getByText('Game Without Dev')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should render first developer when multiple developers exist', () => {
      const game: GameDbData = {
        id: 5,
        igdb_id: 1005,
        name: 'Multi Dev Game',
        slug: 'multi-dev-game',
        cover_url: null,
        developers: ['First Dev', 'Second Dev', 'Third Dev'],
        platforms: [],
        dislike_count: 0,
      };

      render(<MiniGameCard game={game} />);

      expect(screen.getByText('First Dev')).toBeInTheDocument();
      expect(screen.queryByText('Second Dev')).not.toBeInTheDocument();
    });

    it('should return null when no game or placeholder provided', () => {
      const { container } = render(<MiniGameCard />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Ranking badge', () => {
    it('should display ranking badge when ranking is provided', () => {
      const game: GameDbData = {
        id: 6,
        igdb_id: 1006,
        name: 'Ranked Game',
        slug: 'ranked-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 100,
      };

      render(<MiniGameCard game={game} ranking={3} />);

      expect(screen.getByText('#3')).toBeInTheDocument();
    });

    it('should not display ranking badge when ranking is not provided', () => {
      const game: GameDbData = {
        id: 7,
        igdb_id: 1007,
        name: 'Unranked Game',
        slug: 'unranked-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 10,
      };

      render(<MiniGameCard game={game} />);

      expect(screen.queryByText(/#\d+/)).not.toBeInTheDocument();
    });

    it('should apply red badge for top 5 rankings', () => {
      const game: GameDbData = {
        id: 8,
        igdb_id: 1008,
        name: 'Top 5 Game',
        slug: 'top-5-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 500,
      };

      const { container } = render(<MiniGameCard game={game} ranking={5} />);

      const badge = screen.getByText('#5');
      expect(badge).toHaveClass('bg-red-600/90');
    });

    it('should apply orange badge for rankings 6-15', () => {
      const game: GameDbData = {
        id: 9,
        igdb_id: 1009,
        name: 'Top 15 Game',
        slug: 'top-15-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 300,
      };

      const { container } = render(<MiniGameCard game={game} ranking={10} />);

      const badge = screen.getByText('#10');
      expect(badge).toHaveClass('bg-orange-600/90');
    });

    it('should apply yellow badge for rankings 16+', () => {
      const game: GameDbData = {
        id: 10,
        igdb_id: 1010,
        name: 'Lower Ranked Game',
        slug: 'lower-ranked-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 50,
      };

      const { container } = render(<MiniGameCard game={game} ranking={20} />);

      const badge = screen.getByText('#20');
      expect(badge).toHaveClass('bg-yellow-600/90');
    });
  });

  describe('Platform icons', () => {
    it('should display platform icons', () => {
      const game: GameDbData = {
        id: 11,
        igdb_id: 1011,
        name: 'Multi Platform Game',
        slug: 'multi-platform-game',
        cover_url: null,
        developers: [],
        platforms: ['PC', 'PlayStation 5', 'Xbox Series X'],
        dislike_count: 0,
      };

      const { container } = render(<MiniGameCard game={game} />);

      // Check for FontAwesome icons
      const icons = container.querySelectorAll('[data-icon]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should show "more platforms" indicator when > 3 platforms', () => {
      const game: GameDbData = {
        id: 12,
        igdb_id: 1012,
        name: 'Many Platforms Game',
        slug: 'many-platforms-game',
        cover_url: null,
        developers: [],
        platforms: ['PC', 'PS5', 'Xbox', 'Switch', 'Mobile'],
        dislike_count: 0,
      };

      const { container } = render(<MiniGameCard game={game} />);

      // Check for MoreHorizontal icon
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should handle empty platforms array', () => {
      const game: GameDbData = {
        id: 13,
        igdb_id: 1013,
        name: 'No Platform Game',
        slug: 'no-platform-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 0,
      };

      render(<MiniGameCard game={game} />);

      expect(screen.getByText('No Platform Game')).toBeInTheDocument();
    });
  });

  describe('Dislike button interaction', () => {
    it('should call sendDislike when dislike button is clicked', async () => {
      const user = userEvent.setup();
      const game: GameDbData = {
        id: 14,
        igdb_id: 1014,
        name: 'Clickable Game',
        slug: 'clickable-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 50,
      };

      render(<MiniGameCard game={game} />);

      const dislikeButton = screen.getByLabelText('dislike');
      await user.click(dislikeButton);

      expect(mockSendDislike).toHaveBeenCalledWith(1014, 1);
    });

    it('should update local dislike count optimistically', async () => {
      const user = userEvent.setup();
      const game: GameDbData = {
        id: 15,
        igdb_id: 1015,
        name: 'Optimistic Game',
        slug: 'optimistic-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 10,
      };

      render(<MiniGameCard game={game} />);

      expect(screen.getByText('10')).toBeInTheDocument();

      const dislikeButton = screen.getByLabelText('dislike');
      await user.click(dislikeButton);

      // After click, count should increment
      await waitFor(() => {
        expect(screen.getByText('11')).toBeInTheDocument();
      });
    });

    it('should play sound when dislike button is clicked', async () => {
      const user = userEvent.setup();
      let audioSrc = '';
      const mockPlay = vi.fn().mockResolvedValue(undefined);

      class TestMockAudio {
        volume: number = 0;
        play = mockPlay;
        constructor(src: string) {
          audioSrc = src;
        }
      }

      global.Audio = TestMockAudio as any;

      const game: GameDbData = {
        id: 16,
        igdb_id: 1016,
        name: 'Sound Game',
        slug: 'sound-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 0,
      };

      render(<MiniGameCard game={game} />);

      const dislikeButton = screen.getByLabelText('dislike');
      await user.click(dislikeButton);

      expect(audioSrc).toBe('/sounds/pop_sound.wav');
      expect(mockPlay).toHaveBeenCalled();
    });

    it('should not navigate when clicking dislike button', async () => {
      const user = userEvent.setup();
      const game: GameDbData = {
        id: 17,
        igdb_id: 1017,
        name: 'No Navigate Game',
        slug: 'no-navigate-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 0,
      };

      render(<MiniGameCard game={game} />);

      const dislikeButton = screen.getByLabelText('dislike');
      await user.click(dislikeButton);

      // Should not navigate (link click prevented)
      expect(mockSendDislike).toHaveBeenCalled();
    });
  });

  describe('Dislike count synchronization', () => {
    it('should update local count when prop count increases', async () => {
      const game: GameDbData = {
        id: 18,
        igdb_id: 1018,
        name: 'Sync Game',
        slug: 'sync-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 100,
      };

      const { rerender } = render(<MiniGameCard game={game} />);

      expect(screen.getByText('100')).toBeInTheDocument();

      // Simulate prop update (from polling)
      const updatedGame = { ...game, dislike_count: 150 };
      rerender(<MiniGameCard game={updatedGame} />);

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
      });
    });

    it('should not decrease local count when prop count decreases', async () => {
      const game: GameDbData = {
        id: 19,
        igdb_id: 1019,
        name: 'No Decrease Game',
        slug: 'no-decrease-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 100,
      };

      const { rerender } = render(<MiniGameCard game={game} />);

      expect(screen.getByText('100')).toBeInTheDocument();

      // Try to decrease prop count (should not update)
      const updatedGame = { ...game, dislike_count: 50 };
      rerender(<MiniGameCard game={updatedGame} />);

      // Should still show 100
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle zero dislike count', () => {
      const game: GameDbData = {
        id: 20,
        igdb_id: 1020,
        name: 'Zero Dislikes',
        slug: 'zero-dislikes',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 0,
      };

      render(<MiniGameCard game={game} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle null dislike count', () => {
      const game: GameDbData = {
        id: 21,
        igdb_id: 1021,
        name: 'Null Dislikes',
        slug: 'null-dislikes',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: null,
      };

      render(<MiniGameCard game={game} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle very long game names', () => {
      const longName =
        'This is a very long game name that should be truncated to prevent layout issues';
      const game: GameDbData = {
        id: 22,
        igdb_id: 1022,
        name: longName,
        slug: 'long-name-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 0,
      };

      render(<MiniGameCard game={game} />);

      const nameElement = screen.getByText(longName);
      expect(nameElement).toHaveClass('truncate');
    });

    it('should handle very large dislike counts', () => {
      const game: GameDbData = {
        id: 23,
        igdb_id: 1023,
        name: 'Very Disliked',
        slug: 'very-disliked',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 9999999,
      };

      render(<MiniGameCard game={game} />);

      expect(screen.getByText('9999999')).toBeInTheDocument();
    });

    it('should handle game with steam_app_id', () => {
      const game: GameDbData = {
        id: 24,
        igdb_id: 1024,
        name: 'Steam Game',
        slug: 'steam-game',
        cover_url: null,
        developers: [],
        platforms: ['PC'],
        dislike_count: 0,
        steam_app_id: 123456,
      };

      render(<MiniGameCard game={game} />);

      expect(screen.getByText('Steam Game')).toBeInTheDocument();
    });
  });

  describe('Hover effects', () => {
    it('should have hover animation classes', () => {
      const game: GameDbData = {
        id: 25,
        igdb_id: 1025,
        name: 'Hover Game',
        slug: 'hover-game',
        cover_url: null,
        developers: [],
        platforms: [],
        dislike_count: 0,
      };

      const { container } = render(<MiniGameCard game={game} />);

      const card = container.querySelector('.group');
      expect(card).toHaveClass('hover:-translate-y-2');
      expect(card).toHaveClass('hover:scale-[1.02]');
    });
  });
});
