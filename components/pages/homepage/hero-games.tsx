import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsDown, Gamepad2, Trophy, Loader2 } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import PaginationDots from '@/components/shared/pagination-dots';

// Types for Top 10 GameOver data
interface GameOverEntry {
  id: string;
  title: string;
  bannerUrl: string;
  developer: string;
  dislikeCount: number;
  rank: number;
}

interface UserVoteState {
  dailyCost: number;
  maxDailyCost: number;
  votesUsed: number;
  continuousClicks: number;
  lastClickTime: number;
  isPowerMode: boolean;
}

// Types for hero games data from Supabase
interface HeroGame {
  id: number;
  game_id: number;
  added_at: string;
  games: {
    id: number;
    name: string;
    slug: string;
    cover_url: string | null;
    banner_url: string | null;
    developers: string[] | null;
    igdb_id: number;
  };
}

interface HeroGamesResponse {
  success: boolean;
  data: HeroGame[];
  error?: string;
}

const HeroGames = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Animation states - Zoom-style emoji reactions
  const [floatingThumbs, setFloatingThumbs] = useState<
    Array<{
      id: string;
      gameId: string;
      timestamp: number;
      startX: number; // Random start position (0-100%)
      isPowerMode?: boolean;
    }>
  >([]);

  // Fetch hero games data from Supabase
  const {
    data: heroGamesResponse,
    error,
    isLoading,
  } = useSWR<HeroGamesResponse>(
    '/api/hero-games',
    (url) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch hero games');
        return res.json();
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes cache
    },
  );

  // Transform hero games to GameOver format with mock dislike counts
  const [gameOverData, setGameOverData] = useState<GameOverEntry[]>([]);

  // Update gameOverData when hero games data changes
  useEffect(() => {
    if (heroGamesResponse?.data) {
      const transformedData = heroGamesResponse.data.map((heroGame, index) => ({
        id: heroGame.games.igdb_id.toString(),
        title: heroGame.games.name,
        bannerUrl: heroGame.games.banner_url || heroGame.games.cover_url || '',
        developer: heroGame.games.developers?.[0] || 'Unknown Developer',
        dislikeCount: Math.floor(Math.random() * 5000) + 3000, // Mock dislike count
        rank: index + 1,
      }));
      setGameOverData(transformedData);
    }
  }, [heroGamesResponse]);

  // User voting state - simplified to just track votes
  const [userVoteState, setUserVoteState] = useState<UserVoteState>({
    dailyCost: 0, // Not used anymore
    maxDailyCost: 0, // Not used anymore
    votesUsed: 0,
    continuousClicks: 0,
    lastClickTime: 0,
    isPowerMode: false,
  });

  // Button click animations state
  const [clickingButtons, setClickingButtons] = useState<Set<string>>(
    new Set(),
  );

  // Handle dislike vote with Zoom-style reactions
  const handleDislikeVote = (gameId: string) => {
    const currentTime = Date.now();

    // Add button click animation
    setClickingButtons((prev) => new Set([...prev, gameId]));
    setTimeout(() => {
      setClickingButtons((prev) => {
        const newSet = new Set(prev);
        newSet.delete(gameId);
        return newSet;
      });
    }, 200);

    // Find the index of the voted game
    const gameIndex = gameOverData.findIndex((game) => game.id === gameId);

    // Switch to the voted game if it's not currently active
    if (gameIndex !== -1 && gameIndex !== activeIndex) {
      setActiveIndex(gameIndex);
      carouselApi?.scrollTo(gameIndex);
    }

    // Update continuous click tracking and power mode
    setUserVoteState((prev) => {
      const timeSinceLastClick = currentTime - prev.lastClickTime;
      const isConsecutive = timeSinceLastClick < 5000; // Within 5 seconds

      const newContinuousClicks = isConsecutive ? prev.continuousClicks + 1 : 1;
      const newIsPowerMode = newContinuousClicks >= 10;

      return {
        ...prev,
        votesUsed: prev.votesUsed + 1,
        continuousClicks: newContinuousClicks,
        lastClickTime: currentTime,
        isPowerMode: newIsPowerMode,
      };
    });

    // Create Zoom-style floating reaction (bigger if in power mode)
    const isPowerMode = userVoteState.continuousClicks >= 9; // Use previous state to check
    const newThumb = {
      id: `thumb-${Date.now()}-${Math.random()}`,
      gameId,
      timestamp: Date.now(),
      startX: Math.random() * 70 + 15, // Random start position between 15% and 85%
      isPowerMode,
    };

    setFloatingThumbs((prev) => {
      const updated = [...prev, newThumb];
      return updated;
    });

    // Update game dislike count (more if in power mode)
    const increment = isPowerMode ? 3 : 1;
    setGameOverData((prev) =>
      prev.map((game) =>
        game.id === gameId
          ? { ...game, dislikeCount: game.dislikeCount + increment }
          : game,
      ),
    );

    // Note: Framer Motion will auto-remove via onAnimationComplete
  };

  // Reset power mode after 3 seconds of inactivity
  useEffect(() => {
    if (userVoteState.isPowerMode) {
      const timer = setTimeout(() => {
        setUserVoteState((prev) => ({
          ...prev,
          isPowerMode: false,
          continuousClicks: 0,
        }));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [userVoteState.lastClickTime, userVoteState.isPowerMode]);

  // Scroll the active thumbnail into view when activeIndex changes
  useEffect(() => {
    if (thumbnailRefs.current[activeIndex] && gameOverData.length > 0) {
      thumbnailRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeIndex, gameOverData.length]);

  // Error state
  if (error) {
    return (
      <section className="relative mb-12">
        <div className="flex h-64 items-center justify-center rounded-lg border border-red-800 bg-red-900/20 text-red-400">
          <div className="text-center">
            <p className="mb-2">Failed to load GameOver games</p>
            <p className="text-sm opacity-75">Please try again later</p>
          </div>
        </div>
      </section>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <section className="relative mb-12">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">Top 10 GameOver of 2025</h2>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2">
            <ThumbsDown className="h-4 w-4 text-red-500" />
            <span className="text-sm">
              Total Dislikes:{' '}
              <span className="font-bold text-red-500">
                {gameOverData
                  .reduce((sum, game) => sum + game.dislikeCount, 0)
                  .toLocaleString()}
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Main Banner Area */}
          <div className="relative lg:col-span-3">
            <div className="flex aspect-[16/9] w-full items-center justify-center rounded-lg bg-zinc-800/50">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="hidden h-full rounded-lg bg-zinc-800 p-4 lg:block">
            <div className="mb-4">
              <h3 className="mb-2 font-bold text-red-400">Attack Panel</h3>
              <p className="text-xs text-zinc-400">
                Cast your vote to increase the shame!
              </p>
            </div>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (!gameOverData || gameOverData.length === 0) {
    return (
      <section className="relative mb-12">
        <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-400">
          <div className="text-center">
            <Trophy size={48} className="mx-auto mb-4 opacity-50" />
            <p className="mb-2">No GameOver entries available</p>
            <p className="text-sm opacity-75">
              Hero games will appear here once added by admins
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative mb-12">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Top 10 GameOver of 2025</h2>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2">
          <ThumbsDown className="h-4 w-4 text-red-500" />
          <span className="text-sm">
            Total Dislikes: <span className="font-bold text-red-500">0</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Main Banner - Takes 3/4 of the width on large screens */}
        <div className="relative lg:col-span-3">
          {/* Framer Motion Zoom-style Floating Reactions - Moved to Banner */}
          <AnimatePresence>
            {floatingThumbs
              .filter((thumb) => thumb.gameId === gameOverData[activeIndex]?.id)
              .map((thumb) => (
                <motion.div
                  key={thumb.id}
                  className="pointer-events-none absolute z-50"
                  style={{
                    left: `${thumb.startX}%`,
                    bottom: '10%',
                  }}
                  initial={{
                    opacity: 0,
                    scale: 0.2,
                    y: 0,
                  }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: thumb.isPowerMode
                      ? [0.2, 2.2, 2.0, 1.3]
                      : [0.2, 1.5, 1.3, 0.9],
                    y: thumb.isPowerMode
                      ? [0, -60, -180, -350]
                      : [0, -40, -120, -250],
                  }}
                  exit={{
                    opacity: 0,
                    scale: thumb.isPowerMode ? 1.0 : 0.6,
                    y: thumb.isPowerMode ? -400 : -300,
                  }}
                  transition={{
                    duration: thumb.isPowerMode ? 3.5 : 2.5,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    times: [0, 0.15, 0.6, 1],
                  }}
                  onAnimationComplete={() => {
                    // Auto-remove when animation completes
                    setFloatingThumbs((prev) =>
                      prev.filter((t) => t.id !== thumb.id),
                    );
                  }}
                >
                  <ThumbsDown
                    className={`drop-shadow-2xl ${
                      thumb.isPowerMode
                        ? 'h-12 w-12 text-red-400'
                        : 'h-8 w-8 text-red-500'
                    }`}
                    fill="currentColor"
                  />
                  {thumb.isPowerMode && (
                    <motion.div
                      className="absolute -inset-2 rounded-full bg-red-500/30"
                      animate={{
                        scale: [0.8, 1.2, 0.8],
                        opacity: [0.8, 0.3, 0.8],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </motion.div>
              ))}
          </AnimatePresence>

          <Carousel
            opts={{
              loop: true,
              align: 'start',
            }}
            className="w-full"
            setApi={(api) => {
              setCarouselApi(api);
              if (api) {
                api.on('select', () => {
                  if (api) {
                    const selectedIndex = api.selectedScrollSnap();
                    setActiveIndex(selectedIndex);
                  }
                });
              }
            }}
          >
            <CarouselContent>
              {gameOverData.map((game) => (
                <CarouselItem key={game.id}>
                  <div className="game-card relative aspect-[16/9] overflow-hidden rounded-lg">
                    {/* Dislike Count Overlay */}
                    <div className="absolute top-4 left-4 z-20 rounded-lg bg-black/70 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4 text-red-400" />
                        <span className="font-bold text-white">
                          {game.dislikeCount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Rank Badge */}
                    <div className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-red-600 font-bold text-white">
                      #{game.rank}
                    </div>

                    {/* Banner Image */}
                    {game.bannerUrl ? (
                      <Image
                        src={game.bannerUrl}
                        alt={`Banner image for ${game.title}`}
                        width={1920}
                        height={1080}
                        className="h-full w-full object-cover"
                        priority={activeIndex === gameOverData.indexOf(game)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                        <Gamepad2 size={60} className="text-zinc-500" />
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Mobile pagination dots */}
          <PaginationDots
            totalItems={gameOverData.length}
            activeIndex={activeIndex}
            carouselApi={carouselApi}
            className="lg:hidden"
          />
        </div>

        {/* Right Sidebar - Vote/Attack Panel */}
        <div className="relative hidden overflow-hidden rounded-lg bg-zinc-800 p-4 lg:block">
          <div className="mb-4">
            <h3 className="mb-2 font-bold text-red-400">Attack Panel</h3>
            <p className="text-xs text-zinc-400">
              Cast your vote to increase the shame!
            </p>
          </div>

          <div className="space-y-4">
            {gameOverData.map((game, index) => {
              // Find the corresponding hero game data to get cover_url
              const heroGame = heroGamesResponse?.data?.find(
                (hg) => hg.games.igdb_id.toString() === game.id,
              );
              const coverUrl = heroGame?.games.cover_url;

              return (
                <div
                  key={`vote-${game.id}`}
                  ref={(el) => {
                    thumbnailRefs.current[index] = el;
                  }}
                  className={`group relative cursor-pointer rounded-md border-2 p-3 transition-all ${
                    activeIndex === index
                      ? 'border-red-500 bg-red-900/20'
                      : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-700/50'
                  }`}
                  onClick={() => {
                    setActiveIndex(index);
                    carouselApi?.scrollTo(index);
                  }}
                >
                  {/* Rank */}
                  <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                    #{game.rank}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Cover Image */}
                    <div className="flex-shrink-0">
                      {coverUrl ? (
                        <Image
                          src={coverUrl}
                          alt={`${game.title} cover`}
                          width={48}
                          height={64}
                          className="h-16 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-12 items-center justify-center rounded bg-zinc-700">
                          <Gamepad2 size={20} className="text-zinc-500" />
                        </div>
                      )}
                    </div>

                    {/* Game Info */}
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium">
                        {game.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-1 text-red-400">
                        <ThumbsDown size={12} />
                        <span className="text-xs font-bold">
                          {game.dislikeCount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Vote Button */}
                    <motion.div
                      animate={
                        clickingButtons.has(game.id)
                          ? {
                              scale: [1, 0.8, 1.1, 1],
                            }
                          : {}
                      }
                      transition={{ duration: 0.2 }}
                    >
                      <Button
                        size="sm"
                        variant="destructive"
                        className={`relative h-8 w-8 flex-shrink-0 p-0 transition-all hover:scale-110 ${
                          userVoteState.isPowerMode
                            ? 'bg-red-600 shadow-lg shadow-red-500/50 hover:bg-red-700'
                            : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDislikeVote(game.id);
                        }}
                      >
                        <ThumbsDown size={14} />
                        {userVoteState.isPowerMode && (
                          <motion.div
                            className="absolute -inset-1 -z-10 rounded bg-red-500/30"
                            animate={{
                              scale: [0.9, 1.1, 0.9],
                              opacity: [0.5, 0.8, 0.5],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroGames;
