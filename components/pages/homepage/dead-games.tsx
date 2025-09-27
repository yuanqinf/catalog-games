import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Skull,
  Gamepad2,
  Ghost,
  Loader2,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { DeadGameFromAPI, DeadGame } from '@/types';

const DeadGames = () => {
  // Fetch dead games data from Supabase
  const {
    data: deadGamesResponse,
    error,
    isLoading,
  } = useSWR<{ success: boolean; data: DeadGameFromAPI[]; error?: string }>(
    '/api/dead-games',
    (url) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch dead games');
        return res.json();
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute cache
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

  // Floating ghost animations state
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
          deadDate: formattedDate,
          status: deadGame.dead_status,
          developer: deadGame.games.developers?.[0] || 'Unknown Developer',
          publisher: deadGame.games.publishers?.[0] || 'Unknown Publisher',
          coverUrl:
            deadGame.games.cover_url || deadGame.games.banner_url || undefined,
          reactionCount: deadGame.user_reaction_count,
        };
      }) || [];

    // Apply sorting if reaction sort is active
    if (sortByReactions !== 'none') {
      return [...transformedData].sort((a, b) => {
        const aCount = reactionCounts[a.id] ?? a.reactionCount;
        const bCount = reactionCounts[b.id] ?? b.reactionCount;

        if (sortByReactions === 'asc') {
          return aCount - bCount;
        } else {
          return bCount - aCount;
        }
      });
    }

    return transformedData;
  }, [deadGamesResponse?.data, sortByReactions, reactionCounts]);

  // Initialize reaction counts when data loads (only when API data changes, not when sorting changes)
  useEffect(() => {
    if (deadGamesResponse?.data && deadGamesResponse.data.length > 0) {
      const counts = deadGamesResponse.data.reduce(
        (acc, deadGame) => ({
          ...acc,
          [deadGame.id]: deadGame.user_reaction_count,
        }),
        {},
      );
      setReactionCounts(counts);
    }
  }, [deadGamesResponse?.data]);

  const handleReaction = async (
    deadGameId: string,
    event: React.MouseEvent,
  ) => {
    // Get button position for ghost spawn location
    const buttonRect = (event.target as HTMLElement).getBoundingClientRect();
    const containerRect = (event.target as HTMLElement)
      .closest('section')
      ?.getBoundingClientRect();

    if (buttonRect && containerRect) {
      // Add random offset around the button position
      const randomOffsetX = (Math.random() - 0.5) * 200; // ±100px horizontal
      const randomOffsetY = (Math.random() - 0.5) * 30; // ±15px vertical

      // Create floating ghost animation with random position
      const newGhost = {
        id: `ghost-${Date.now()}-${Math.random()}`,
        gameId: deadGameId,
        timestamp: Date.now(),
        startX:
          buttonRect.left -
          containerRect.left * 1.5 +
          buttonRect.width / 2 +
          randomOffsetX,
        startY:
          buttonRect.top -
          containerRect.top +
          buttonRect.height / 2 +
          randomOffsetY,
      };

      setFloatingGhosts((prev) => [...prev, newGhost]);
    }

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
    if (sortByReactions === 'none') {
      setSortByReactions('desc'); // First click: highest reactions first
    } else if (sortByReactions === 'desc') {
      setSortByReactions('asc'); // Second click: lowest reactions first
    } else {
      setSortByReactions('none'); // Third click: back to default (date order)
    }
  };

  // Error state
  if (error) {
    return (
      <section className="relative mb-16 px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <Skull className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
            <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              Game Graveyard
            </h2>
            <Skull className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
          </div>
        </div>
        <div className="flex h-64 items-center justify-center rounded-lg border border-red-800 bg-red-900/20 text-red-400">
          <div className="text-center">
            <p className="mb-2">Failed to load dead games</p>
            <p className="text-sm opacity-75">Please try again later</p>
          </div>
        </div>
      </section>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <section className="relative mb-16 px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <Skull className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
            <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              Game Graveyard
            </h2>
            <Skull className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
          </div>
        </div>
        <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <p className="text-zinc-400">Loading dead games...</p>
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (!deadGames || deadGames.length === 0) {
    return (
      <section className="relative mb-16 px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <Skull className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
            <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              Game Graveyard
            </h2>
            <Skull className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
          </div>
        </div>
        <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-400">
          <div className="text-center">
            <Skull size={48} className="mx-auto mb-4 opacity-50" />
            <p className="mb-2">The graveyard is empty</p>
            <p className="text-sm opacity-75">
              No dead games have been added yet
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative mb-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-6 flex items-center justify-center gap-4">
          <Skull className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Game Graveyard
          </h2>
          <Skull className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
        </div>
      </div>

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
                prev.filter((g) => g.id !== ghost.id),
              );
            }}
          >
            <Ghost
              className="h-8 w-8 text-zinc-300 drop-shadow-2xl"
              fill="currentColor"
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Dead Games List */}
      <div className="max-w-8xl mx-auto">
        <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/50 shadow-2xl">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 px-6 py-6" />
                <TableHead className="px-6 py-6">Game</TableHead>
                <TableHead className="hidden px-6 py-6 sm:table-cell">
                  Date
                </TableHead>
                <TableHead className="px-6 py-6">Status</TableHead>
                <TableHead className="hidden px-6 py-6 lg:table-cell">
                  Developer
                </TableHead>
                <TableHead className="hidden px-6 py-6 xl:table-cell">
                  Publisher
                </TableHead>
                <TableHead className="px-6 py-6 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSortByReactions}
                    className="mx-auto flex items-center gap-1 px-2 py-1 text-zinc-400 hover:text-zinc-200"
                  >
                    <Ghost className="h-4 w-4" />
                    {sortByReactions === 'none' && (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                    {sortByReactions === 'desc' && (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {sortByReactions === 'asc' && (
                      <ChevronUp className="h-3 w-3" />
                    )}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deadGames.map((game) => (
                <TableRow key={game.id} className="group">
                  <TableCell className="w-20 px-6 py-6">
                    <div className="flex h-16 w-12 items-center justify-center overflow-hidden rounded-lg bg-zinc-800 shadow-md">
                      {game.coverUrl ? (
                        <Image
                          src={game.coverUrl}
                          alt={`${game.name} cover`}
                          width={48}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Gamepad2 className="h-6 w-6 text-zinc-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-6 font-semibold">
                    <div className="text-base text-white group-hover:text-zinc-100 sm:text-lg">
                      {game.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden px-6 py-6 sm:table-cell">
                    {game.deadDate}
                  </TableCell>
                  <TableCell className="px-6 py-6">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                        game.status === 'Shutdown'
                          ? 'border border-red-700/50 bg-red-900/40 text-red-300'
                          : 'border border-orange-700/50 bg-orange-900/40 text-orange-300'
                      }`}
                    >
                      {game.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden px-6 py-6 lg:table-cell">
                    {game.developer}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden px-6 py-6 xl:table-cell">
                    {game.publisher}
                  </TableCell>
                  <TableCell className="px-6 py-6 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className={`group w-20 border-zinc-600 bg-zinc-800/50 transition-all duration-200 hover:scale-105 hover:border-zinc-500 hover:bg-zinc-700 ${
                        clickingButtons.has(game.id)
                          ? 'scale-95 bg-zinc-600'
                          : ''
                      }`}
                      onClick={(e) => handleReaction(game.id, e)}
                    >
                      <Ghost className="mr-2 h-4 w-4 text-zinc-400 transition-colors group-hover:text-white" />
                      <span className="font-medium text-zinc-300 group-hover:text-white">
                        {reactionCounts[game.id]?.toLocaleString() || 0}
                      </span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Bottom Quote */}
      <div className="mt-16 text-center">
        <p className="mx-auto max-w-2xl text-base text-gray-400 italic sm:text-lg">
          {
            "I've always felt that 'game over' is a state of failure more for the game designer than from the player."
          }
        </p>
        <p className="mt-2 text-sm text-gray-500">—— David Cage</p>
      </div>
    </section>
  );
};

export default DeadGames;
