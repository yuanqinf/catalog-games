'use client';

import React, { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Loader2 } from 'lucide-react';
import { DeadGameFromAPI, DeadGame } from '@/types';
import { triggerCountIncreaseAnimations } from '@/utils/animation-utils';
import { DeadGamesTable } from './DeadGamesTable';

interface DeadGamesTableContainerProps {
  limit?: number; // undefined = show all games
  showSorting?: boolean;
  showGameCount?: boolean;
}

export const DeadGamesTableContainer: React.FC<
  DeadGamesTableContainerProps
> = ({ limit, showSorting = false, showGameCount = false }) => {
  // Fetch dead games data from Supabase with short polling for real-time updates
  const {
    data: deadGamesResponse,
    error,
    isLoading,
    mutate,
  } = useSWR<{ success: boolean; data: DeadGameFromAPI[]; error?: string }>(
    '/api/dead-games',
    (url) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch dead games');
        return res.json();
      }),
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
      deadGamesResponse?.data?.map((deadGame) => {
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
    deadGamesResponse?.data,
    sortByReactions,
    sortByDate,
    reactionCounts,
    limit,
    showSorting,
  ]);

  // Initialize reaction counts when data loads and trigger animations on count increases
  useEffect(() => {
    if (deadGamesResponse?.data && deadGamesResponse.data.length > 0) {
      setReactionCounts((prevCounts) => {
        const newCounts = deadGamesResponse.data.reduce(
          (acc, deadGame) => ({
            ...acc,
            [deadGame.id]: deadGame.user_reaction_count,
          }),
          {},
        );

        // Check for reaction count increases and trigger animations
        deadGamesResponse.data.forEach((deadGame) => {
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
  }, [deadGamesResponse?.data]);

  const handleReaction = async (deadGameId: string) => {
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

    // Call backend API to update the database
    try {
      const response = await fetch('/api/dead-games/react', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deadGameId,
          incrementBy: 1,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Failed to update reaction count:', result.error);
        // Revert optimistic update on error
        setReactionCounts((prev) => ({
          ...prev,
          [deadGameId]: Math.max((prev[deadGameId] || 0) - 1, 0),
        }));
      } else {
        // Success - immediately fetch fresh data from server
        mutate();
      }
    } catch (error) {
      console.error('Error calling reaction API:', error);
      // Revert optimistic update on error
      setReactionCounts((prev) => ({
        ...prev,
        [deadGameId]: Math.max((prev[deadGameId] || 0) - 1, 0),
      }));
    }
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
      <div className="flex h-64 items-center justify-center rounded-lg border border-red-800 bg-red-900/20 text-red-400">
        <div className="text-center">
          <p className="mb-2">Failed to load dead games</p>
          <p className="text-sm opacity-75">Please try again later</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <p className="text-zinc-400">Loading dead games...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!deadGames || deadGames.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-400">
        <div className="text-center">
          <Ghost size={48} className="mx-auto mb-4 opacity-50" />
          <p className="mb-2">The graveyard is empty</p>
          <p className="text-sm opacity-75">
            No dead games have been added yet
          </p>
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
            <Ghost className="h-8 w-8 text-zinc-300 drop-shadow-2xl" />
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
    </div>
  );
};
