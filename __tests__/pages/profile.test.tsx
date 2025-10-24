import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../__mocks__/server';
import UserProfilePage from '@/app/(root)/profile/page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

// Mock Clerk
const mockUser = {
  username: 'testuser',
  imageUrl: 'https://example.com/avatar.jpg',
  primaryEmailAddress: {
    emailAddress: 'test@example.com',
  },
};

vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
}));

// Mock i18n
vi.mock('@/lib/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        profile_quote:
          'Every click is a message. Every dislike is a statement.',
        profile_quote_author: '— Anonymous Gamer',
        profile_total_dislikes: 'Total Dislikes',
        profile_my_disliked_games: 'My Disliked Games',
        profile_no_disliked_games:
          "You haven't disliked any games yet. Start exploring!",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock ProfileGameCard component
vi.mock('@/components/shared/cards/profile-game-card', () => ({
  default: ({
    game,
    userGameDislikeCount,
    userGameEmojiCount,
  }: {
    game: any;
    userGameDislikeCount: number;
    userGameEmojiCount: number;
  }) => (
    <div data-testid={`profile-game-card-${game.id}`}>
      <div>{game.name}</div>
      <div data-testid={`dislike-count-${game.id}`}>{userGameDislikeCount}</div>
      <div data-testid={`emoji-count-${game.id}`}>{userGameEmojiCount}</div>
    </div>
  ),
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h1 className={className}>{children}</h1>
  ),
  CardDescription: ({ children, className }: any) => (
    <p className={className}>{children}</p>
  ),
}));

// Get useUser from the mock
import { useUser } from '@clerk/nextjs';

describe('UserProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    // Reset MSW handlers
    server.resetHandlers();
  });

  describe('Authentication', () => {
    it('should show loading spinner when not loaded', () => {
      (useUser as any).mockReturnValue({
        isLoaded: false,
        isSignedIn: false,
        user: null,
      });

      const { container } = render(<UserProfilePage />);

      // Look for the loading spinner by its animate-spin class
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should redirect to home when not signed in', () => {
      (useUser as any).mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        user: null,
      });

      render(<UserProfilePage />);

      waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should return null when not signed in', () => {
      (useUser as any).mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        user: null,
      });

      const { container } = render(<UserProfilePage />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('User info display', () => {
    it('should display user avatar', async () => {
      (useUser as any).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      });

      server.use(
        http.get('/api/users/dislikes', () => {
          return HttpResponse.json({
            success: true,
            data: { totalDislikes: 42 },
          });
        }),
        http.get('/api/users/interacted-games', () => {
          return HttpResponse.json({
            success: true,
            data: [],
          });
        }),
      );

      render(<UserProfilePage />);

      await waitFor(() => {
        const avatars = screen.getAllByAltText('User profile picture');
        expect(avatars[0]).toBeInTheDocument();
        expect(avatars[0]).toHaveAttribute('src', mockUser.imageUrl);
      });
    });

    it('should display username', async () => {
      (useUser as any).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      });

      server.use(
        http.get('/api/users/dislikes', () => {
          return HttpResponse.json({
            success: true,
            data: { totalDislikes: 42 },
          });
        }),
        http.get('/api/users/interacted-games', () => {
          return HttpResponse.json({
            success: true,
            data: [],
          });
        }),
      );

      render(<UserProfilePage />);

      await waitFor(() => {
        const usernames = screen.getAllByText('testuser');
        expect(usernames[0]).toBeInTheDocument();
      });
    });

    it('should display email address', async () => {
      (useUser as any).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      });

      server.use(
        http.get('/api/users/dislikes', () => {
          return HttpResponse.json({
            success: true,
            data: { totalDislikes: 42 },
          });
        }),
        http.get('/api/users/interacted-games', () => {
          return HttpResponse.json({
            success: true,
            data: [],
          });
        }),
      );

      render(<UserProfilePage />);

      await waitFor(() => {
        const emails = screen.getAllByText('test@example.com');
        expect(emails[0]).toBeInTheDocument();
      });
    });

    it('should display profile quote', async () => {
      (useUser as any).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      });

      server.use(
        http.get('/api/users/dislikes', () => {
          return HttpResponse.json({
            success: true,
            data: { totalDislikes: 42 },
          });
        }),
        http.get('/api/users/interacted-games', () => {
          return HttpResponse.json({
            success: true,
            data: [],
          });
        }),
      );

      render(<UserProfilePage />);

      await waitFor(() => {
        const quotes = screen.getAllByText(
          'Every click is a message. Every dislike is a statement.',
        );
        expect(quotes[0]).toBeInTheDocument();
        const authors = screen.getAllByText('— Anonymous Gamer');
        expect(authors[0]).toBeInTheDocument();
      });
    });
  });

  describe('Dislike count', () => {
    it('should fetch and display total dislikes', async () => {
      (useUser as any).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      });

      server.use(
        http.get('/api/users/dislikes', () => {
          return HttpResponse.json({
            success: true,
            data: { totalDislikes: 123 },
          });
        }),
        http.get('/api/users/interacted-games', () => {
          return HttpResponse.json({
            success: true,
            data: [],
          });
        }),
      );

      render(<UserProfilePage />);

      await waitFor(() => {
        const dislikes = screen.getAllByText('123');
        expect(dislikes[0]).toBeInTheDocument();
        expect(screen.getAllByText('Total Dislikes')[0]).toBeInTheDocument();
      });
    });

    it('should show loading spinner while fetching dislikes', () => {
      (useUser as any).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      });

      // Don't set up handlers - requests will hang, showing loading state
      const { container } = render(<UserProfilePage />);

      // Loading spinner should be visible initially
      const spinners = container.querySelectorAll('.animate-spin');
      expect(spinners.length).toBeGreaterThan(0);
    });

    it('should handle dislike count fetch error gracefully', async () => {
      (useUser as any).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      });

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      server.use(
        http.get('/api/users/dislikes', () => {
          return HttpResponse.error();
        }),
        http.get('/api/users/interacted-games', () => {
          return HttpResponse.json({
            success: true,
            data: [],
          });
        }),
      );

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle zero dislikes', async () => {
      (useUser as any).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      });

      server.use(
        http.get('/api/users/dislikes', () => {
          return HttpResponse.json({
            success: true,
            data: { totalDislikes: 0 },
          });
        }),
        http.get('/api/users/interacted-games', () => {
          return HttpResponse.json({
            success: true,
            data: [],
          });
        }),
      );

      render(<UserProfilePage />);

      await waitFor(() => {
        const zeros = screen.getAllByText('0');
        expect(zeros[0]).toBeInTheDocument();
      });
    });
  });

  describe('Interacted games', () => {
    beforeEach(() => {
      (useUser as any).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      });
    });

    it('should fetch and display interacted games', async () => {
      const mockGames = [
        {
          id: 1,
          igdb_id: 1001,
          name: 'Game 1',
          slug: 'game-1',
          cover_url: null,
          developers: [],
          platforms: [],
          dislike_count: 100,
          user_dislike_count: 5,
          user_emoji_count: 3,
        },
        {
          id: 2,
          igdb_id: 1002,
          name: 'Game 2',
          slug: 'game-2',
          cover_url: null,
          developers: [],
          platforms: [],
          dislike_count: 200,
          user_dislike_count: 10,
          user_emoji_count: 0,
        },
      ];

      server.use(
        http.get('/api/users/dislikes', () => {
          return HttpResponse.json({
            success: true,
            data: { totalDislikes: 15 },
          });
        }),
        http.get('/api/users/interacted-games', () => {
          return HttpResponse.json({
            success: true,
            data: mockGames,
          });
        }),
      );

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Game 1')).toBeInTheDocument();
        expect(screen.getByText('Game 2')).toBeInTheDocument();
        expect(screen.getByTestId('dislike-count-1')).toHaveTextContent('5');
        expect(screen.getByTestId('dislike-count-2')).toHaveTextContent('10');
        expect(screen.getByTestId('emoji-count-1')).toHaveTextContent('3');
        expect(screen.getByTestId('emoji-count-2')).toHaveTextContent('0');
      });
    });

    it('should show "no games" message when list is empty', async () => {
      server.use(
        http.get('/api/users/dislikes', () => {
          return HttpResponse.json({
            success: true,
            data: { totalDislikes: 0 },
          });
        }),
        http.get('/api/users/interacted-games', () => {
          return HttpResponse.json({
            success: true,
            data: [],
          });
        }),
      );

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(
          screen.getByText(
            "You haven't disliked any games yet. Start exploring!",
          ),
        ).toBeInTheDocument();
      });
    });

    it('should show loading spinner while fetching games', () => {
      // Don't set up handlers - requests will hang, showing loading state
      const { container } = render(<UserProfilePage />);

      // Loading spinner should be visible
      const spinners = container.querySelectorAll('.animate-spin');
      expect(spinners.length).toBeGreaterThan(0);
    });

    it('should handle games fetch error gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      server.use(
        http.get('/api/users/dislikes', () => {
          return HttpResponse.json({
            success: true,
            data: { totalDislikes: 0 },
          });
        }),
        http.get('/api/users/interacted-games', () => {
          return HttpResponse.error();
        }),
      );

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should display section title', async () => {
      server.use(
        http.get('/api/users/dislikes', () => {
          return HttpResponse.json({
            success: true,
            data: { totalDislikes: 0 },
          });
        }),
        http.get('/api/users/interacted-games', () => {
          return HttpResponse.json({
            success: true,
            data: [],
          });
        }),
      );

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('My Disliked Games')).toBeInTheDocument();
      });
    });
  });

  describe('Layout and responsiveness', () => {
    beforeEach(() => {
      (useUser as any).mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      });

      server.use(
        http.get('/api/users/dislikes', () => {
          return HttpResponse.json({
            success: true,
            data: { totalDislikes: 0 },
          });
        }),
        http.get('/api/users/interacted-games', () => {
          return HttpResponse.json({
            success: true,
            data: [],
          });
        }),
      );
    });

    it('should render Card component', async () => {
      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByTestId('card')).toBeInTheDocument();
      });
    });

    it('should have responsive container classes', async () => {
      const { container } = render(<UserProfilePage />);

      await waitFor(() => {
        const main = container.querySelector('main');
        expect(main).toHaveClass('container');
        expect(main).toHaveClass('mx-auto');
      });
    });
  });
});
