'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Loader2 } from 'lucide-react';
import { DeadGameFromAPI, DeadGame } from '@/types';
import { GameService } from '@/lib/supabase/client';
import { triggerCountIncreaseAnimations } from '@/utils/animation-utils';
import { DeadGamesTable } from './dead-games-table';
import { useThrottledDeadGameReaction } from '@/hooks/useThrottledDeadGameReaction';
import { FeedbackDialog } from '@/components/shared/feedback-dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/client';

interface DeadGamesTableContainerProps {
  limit?: number; // undefined = show all games
  showSorting?: boolean;
  showAddDeadGameRow?: boolean;
}

export const DeadGamesTableContainer: React.FC<
  DeadGamesTableContainerProps
> = ({ limit, showSorting = false, showAddDeadGameRow = false }) => {
  const { t } = useTranslation();
  // Fetch dead games data directly from Supabase with short polling for real-time updates
  const {
    data: deadGamesData,
    error,
    isLoading,
    mutate,
  } = useSWR<DeadGameFromAPI[]>(
    'dead-games',
    async () => {
      const gameService = new GameService();
      const data = await gameService.getDeadGames();
      return data as unknown as DeadGameFromAPI[];
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 5000,
      dedupingInterval: 2000,
      revalidateOnReconnect: false,
    },
  );

  // State declarations
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(
    {},
  );
  const [clickingButtons, setClickingButtons] = useState<Set<string>>(
    new Set(),
  );
  const [sortByReactions, setSortByReactions] = useState<
    'none' | 'asc' | 'desc'
  >('none');
  const [sortByDate, setSortByDate] = useState<'none' | 'asc' | 'desc'>('desc');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Use throttled reaction hook for optimized API calls
  const { sendReaction } = useThrottledDeadGameReaction({
    onError: (error, increment) => {
      console.error('Failed to update reaction count:', error);
      // Note: Error handling per-game is done in handleReaction
    },
    onSuccess: () => {
      mutate(); // Refresh data from server
    },
  });

  // Floating Ghost animations state
  const [floatingGhosts, setFloatingGhosts] = useState<
    Array<{
      id: string;
      gameId: string;
      timestamp: number;
      startX: number;
      startY: number;
    }>
  >([]);

  // Transform and sort API data
  const deadGames: DeadGame[] = useMemo(() => {
    const transformedData =
      deadGamesData?.map((deadGame) => {
        const date = new Date(deadGame.dead_date);
        const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;

        return {
          id: deadGame.id,
          name: deadGame.games.name,
          slug: deadGame.games.slug,
          deadDate: formattedDate,
          status: deadGame.dead_status,
          developer: deadGame.games.developers?.[0] || 'Unknown Developer',
          publisher: deadGame.games.publishers?.[0] || 'Unknown Publisher',
          coverUrl:
            deadGame.games.cover_url || deadGame.games.banner_url || undefined,
          reactionCount: deadGame.user_reaction_count,
        };
      }) || [];

    // Apply sorting based on active sort type (only if sorting is enabled)
    if (showSorting && sortByReactions !== 'none') {
      const sorted = [...transformedData].sort((a, b) => {
        const aCount = reactionCounts[a.id] ?? a.reactionCount;
        const bCount = reactionCounts[b.id] ?? b.reactionCount;

        if (sortByReactions === 'asc') {
          return aCount - bCount;
        } else {
          return bCount - aCount;
        }
      });
      return limit ? sorted.slice(0, limit) : sorted;
    }

    if (showSorting && sortByDate !== 'none') {
      const sorted = [...transformedData].sort((a, b) => {
        const aDate = new Date(a.deadDate);
        const bDate = new Date(b.deadDate);
        return sortByDate === 'asc'
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      });
      return limit ? sorted.slice(0, limit) : sorted;
    }

    // Return with or without limit
    return limit ? transformedData.slice(0, limit) : transformedData;
  }, [
    deadGamesData,
    sortByReactions,
    sortByDate,
    reactionCounts,
    limit,
    showSorting,
  ]);

  // Initialize reaction counts when data loads and trigger animations on count increases
  useEffect(() => {
    if (deadGamesData && deadGamesData.length > 0) {
      setReactionCounts((prevCounts) => {
        const newCounts = deadGamesData.reduce(
          (acc, deadGame) => ({
            ...acc,
            [deadGame.id]: deadGame.user_reaction_count,
          }),
          {},
        );

        // Check for reaction count increases and trigger animations
        deadGamesData.forEach((deadGame) => {
          const oldCount = prevCounts[deadGame.id] || 0;
          const newCount = deadGame.user_reaction_count / 10; // Divide by 10 to reduce the number of animations

          // Create floating ghost animation centered on screen with random offset
          const randomOffsetX = ((Math.random() - 0.5) * window.innerWidth) / 2;
          const randomOffsetY = (Math.random() - 0.5) * 300; // ±150px vertical
          // Use the utility function to trigger animations
          triggerCountIncreaseAnimations(
            deadGame.id,
            oldCount,
            newCount,
            setFloatingGhosts,
            (itemId, animationId) => ({
              id: animationId,
              gameId: itemId,
              timestamp: Date.now(),
              startX: window.innerWidth / 2 + randomOffsetX,
              startY: window.innerHeight / 2 + randomOffsetY,
            }),
            'ghost-polling',
          );
        });

        return newCounts;
      });
    }
  }, [deadGamesData]);

  const handleReaction = (deadGameId: string) => {
    // Play pop sound effect
    const audio = new Audio('/sounds/ghost_sound.wav');
    audio.volume = 0.1;
    audio.play().catch((error) => console.error('Error playing sound:', error));

    // Create floating ghost animation centered on screen with random offset
    const randomOffsetX = ((Math.random() - 0.5) * window.innerWidth) / 2;
    const randomOffsetY = (Math.random() - 0.5) * 300; // ±150px vertical

    const newGhost = {
      id: `Ghost-${Date.now()}-${Math.random()}`,
      gameId: deadGameId,
      timestamp: Date.now(),
      startX: window.innerWidth / 2 + randomOffsetX,
      startY: window.innerHeight / 2 + randomOffsetY,
    };

    setFloatingGhosts((prev) => [...prev, newGhost]);

    // Add button click animation
    setClickingButtons((prev) => new Set([...prev, deadGameId]));
    setTimeout(() => {
      setClickingButtons((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deadGameId);
        return newSet;
      });
    }, 200);

    // Optimistically update the UI
    setReactionCounts((prev) => ({
      ...prev,
      [deadGameId]: (prev[deadGameId] || 0) + 1,
    }));

    // Use throttled hook to send API request
    sendReaction(deadGameId, 1);
  };

  const handleSortByReactions = () => {
    // Reset date sorting when sorting by reactions
    setSortByDate('none');

    if (sortByReactions === 'none') {
      setSortByReactions('desc'); // First click: highest reactions first
    } else if (sortByReactions === 'desc') {
      setSortByReactions('asc'); // Second click: lowest reactions first
    } else {
      setSortByReactions('none'); // Third click: back to default (date order)
    }
  };

  const handleSortByDate = () => {
    // Reset reaction sorting when sorting by date
    setSortByReactions('none');

    if (sortByDate === 'none') {
      setSortByDate('desc'); // First click: newest deaths first
    } else if (sortByDate === 'desc') {
      setSortByDate('asc'); // Second click: oldest deaths first
    } else {
      setSortByDate('none'); // Third click: back to default
    }
  };

  // Error state
  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-zinc-800/50">
        <div className="text-center">
          <p className="mb-2">{t('explore_failed_load_dead_games')}</p>
          <p className="text-sm opacity-75">{t('explore_try_again_later')}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-gray-400">{t('explore_loading_dead_games')}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!deadGames || deadGames.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 text-gray-400">
        <div className="text-center">
          <Ghost size={48} className="mx-auto mb-4 opacity-50" />
          <p className="mb-2">{t('explore_graveyard_empty')}</p>
          <p className="text-sm opacity-75">{t('explore_no_dead_games_yet')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Floating Ghost Animations */}
      <AnimatePresence>
        {floatingGhosts.map((ghost) => (
          <motion.div
            key={ghost.id}
            className="pointer-events-none absolute z-50"
            style={{
              left: ghost.startX,
              top: ghost.startY,
            }}
            initial={{
              opacity: 0,
              scale: 0.2,
              y: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.2, 1.5, 1.3, 0.9],
              y: [0, -40, -120, -250],
            }}
            exit={{
              opacity: 0,
              scale: 0.6,
              y: -300,
            }}
            transition={{
              duration: 2.5,
              ease: [0.25, 0.46, 0.45, 0.94],
              times: [0, 0.15, 0.6, 1],
            }}
            onAnimationComplete={() => {
              // Auto-remove when animation completes
              setFloatingGhosts((prev) =>
                prev.filter((s) => s.id !== ghost.id),
              );
            }}
          >
            <Ghost className="h-8 w-8 text-gray-300 drop-shadow-2xl" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Dead Games Table */}
      <DeadGamesTable
        games={deadGames}
        reactionCounts={reactionCounts}
        clickingButtons={clickingButtons}
        onReaction={handleReaction}
        showSorting={showSorting}
        sortByReactions={sortByReactions}
        sortByDate={sortByDate}
        onSortByReactions={handleSortByReactions}
        onSortByDate={handleSortByDate}
      />

      {/* Add Dead Game Row */}
      {showAddDeadGameRow && (
        <div className="max-w-8xl mx-auto mt-6">
          <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/50 shadow-2xl">
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-6 px-6 py-6">
              {/* Ghost Icon Skeleton */}
              <div className="flex h-16 w-12 items-center justify-center overflow-hidden rounded-lg bg-zinc-800/50 shadow-md">
                <Ghost className="h-6 w-6 text-gray-500 opacity-50" />
              </div>

              {/* Game Name Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-zinc-800/50" />
                <div className="h-3 w-32 animate-pulse rounded bg-zinc-800/30" />
              </div>

              <div className="space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-zinc-800/50" />
                <div className="h-3 w-32 animate-pulse rounded bg-zinc-800/30" />
              </div>

              <div className="space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-zinc-800/50" />
                <div className="h-3 w-32 animate-pulse rounded bg-zinc-800/30" />
              </div>

              {/* Text and Button */}
              <div className="col-span-full flex items-center justify-center gap-6 border-t border-zinc-800 pt-4 sm:col-span-1 sm:border-0 sm:pt-0">
                <span className="hidden text-base text-gray-400 lg:inline">
                  {t('explore_know_another_game')}
                </span>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsFeedbackOpen(true)}
                  className="border-zinc-600 bg-zinc-800/50 text-gray-300 transition-all duration-200 hover:scale-105 hover:border-zinc-500 hover:bg-zinc-700 hover:text-white"
                >
                  {t('explore_let_us_know')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={isFeedbackOpen}
        onOpenChange={setIsFeedbackOpen}
        defaultReason="add-dead-games"
      />
    </div>
  );
};
