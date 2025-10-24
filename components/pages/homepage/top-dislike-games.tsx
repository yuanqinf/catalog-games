'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ThumbsDown, Loader2, ExternalLink } from 'lucide-react';
import { CarouselApi } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import PaginationDots from '@/components/shared/pagination-dots';
import MiniGameCard from '@/components/shared/cards/mini-game-card';
import { useThrottledDislikeReaction } from '@/hooks/useThrottledDislikeReaction';
import { useTopDislikedGames } from './hooks/use-top-disliked-games';
import { useVoteState } from './hooks/use-vote-state';
import { FloatingThumbs } from './components/floating-thumbs';
import { GameCarousel } from './components/game-carousel';
import { VoteSidebar } from './components/vote-sidebar';
import { useTranslation } from '@/lib/i18n/client';
import { DeadGameFromAPI } from '@/types';

interface TopDislikeGamesProps {
  initialData?: DeadGameFromAPI[];
}

const TopDislikeGames = ({ initialData }: TopDislikeGamesProps) => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);

  const {
    dissGameData,
    setDissGameData,
    floatingThumbs,
    setFloatingThumbs,
    topDislikedGamesResponse,
    error,
    isLoading,
    mutate,
  } = useTopDislikedGames({ initialData });

  const {
    userVoteState,
    setUserVoteState,
    clickingButtons,
    setClickingButtons,
  } = useVoteState();

  const { sendDislike } = useThrottledDislikeReaction({
    onSuccess: () => mutate(),
  });

  // Handle dislike vote with Zoom-style reactions and backend API call
  const handleDislikeVote = async (gameId: string) => {
    const currentTime = Date.now();

    // Play pop sound effect
    const audio = new Audio('/sounds/pop_sound.wav');
    audio.volume = 0.2;
    audio.play().catch((error) => console.error('Error playing sound:', error));

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
    const gameIndex = dissGameData.findIndex((game) => game.id === gameId);

    // Switch to the voted game if it's not currently active
    if (gameIndex !== -1 && gameIndex !== activeIndex) {
      setActiveIndex(gameIndex);
      carouselApi?.scrollTo(gameIndex);
    }

    // Update continuous click tracking and power mode
    setUserVoteState((prev) => {
      const timeSinceLastClick = currentTime - prev.lastClickTime;
      const isConsecutive = timeSinceLastClick < 5000;

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
    const increment = isPowerMode ? 3 : 1;

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

    // Optimistically update the UI immediately
    setDissGameData((prev) =>
      prev.map((game) =>
        game.id === gameId
          ? { ...game, dislikeCount: game.dislikeCount + increment }
          : game,
      ),
    );

    // Use throttled hook to send API request
    sendDislike(parseInt(gameId), increment);
  };

  useEffect(() => {
    if (userVoteState.lastClickTime > 0) {
      const syncTimer = setTimeout(() => mutate(), 2000);
      return () => clearTimeout(syncTimer);
    }
  }, [userVoteState.lastClickTime, mutate]);

  // Scroll the active thumbnail into view when activeIndex changes
  useEffect(() => {
    if (thumbnailRefs.current[activeIndex] && dissGameData.length > 0) {
      thumbnailRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeIndex, dissGameData.length]);

  // Error state
  if (error) {
    return (
      <section className="relative mb-12">
        <div className="flex h-64 items-center justify-center rounded-lg border bg-zinc-800/50">
          <div className="text-center">
            <p className="mb-2">{t('homepage_failed_load_disliked_games')}</p>
            <p className="text-sm opacity-75">
              {t('homepage_please_try_again')}
            </p>
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
            <ThumbsDown className="h-6 w-6 fill-current text-red-500" />
            <h2 className="text-2xl font-bold">
              {t('homepage_hall_of_shame')}
            </h2>
          </div>
          <Link href="/explore">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-zinc-600 bg-zinc-800 text-gray-300 hover:bg-zinc-700 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm">{t('homepage_explore_more')}</span>
            </Button>
          </Link>
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
              <h3 className="mb-2 font-bold text-red-400">
                {t('homepage_attack_panel')}
              </h3>
              <p className="text-xs text-gray-400">
                {t('homepage_cast_vote_increase_shame')}
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
  if (!dissGameData || dissGameData.length === 0) {
    return (
      <section className="relative mb-12">
        <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 text-gray-400">
          <div className="text-center">
            <ThumbsDown size={48} className="mx-auto mb-4 opacity-50" />
            <p className="mb-2">{t('homepage_no_disliked_games')}</p>
            <p className="text-sm opacity-75">
              {t('homepage_no_disliked_games_description')}
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
          <ThumbsDown className="h-6 w-6 fill-current text-red-500" />
          <h2 className="text-2xl font-bold">{t('homepage_hall_of_shame')}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Main Banner - Takes 3/4 of the width on large screens */}
        <div className="relative lg:col-span-3">
          <FloatingThumbs
            floatingThumbs={floatingThumbs}
            activeGameId={dissGameData[activeIndex]?.id}
            onAnimationComplete={(id) => {
              setFloatingThumbs((prev) => prev.filter((t) => t.id !== id));
            }}
          />

          <GameCarousel
            games={dissGameData}
            activeIndex={activeIndex}
            clickingButtons={clickingButtons}
            onApiReady={(api) => {
              setCarouselApi(api);
              if (api) {
                api.on('select', () => {
                  const selectedIndex = api?.selectedScrollSnap();
                  setActiveIndex(selectedIndex);
                });
              }
            }}
            onVote={handleDislikeVote}
          />

          {/* Mobile pagination dots */}
          <PaginationDots
            totalItems={Math.min(dissGameData.length, 5)}
            activeIndex={activeIndex}
            carouselApi={carouselApi}
            className="lg:hidden"
          />
        </div>

        <VoteSidebar
          games={dissGameData}
          topDislikedGamesData={topDislikedGamesResponse?.data}
          activeIndex={activeIndex}
          clickingButtons={clickingButtons}
          thumbnailRefs={thumbnailRefs}
          onGameClick={(index) => {
            setActiveIndex(index);
            carouselApi?.scrollTo(index);
          }}
          onVote={handleDislikeVote}
        />
      </div>

      {/* Top 6 - 10 Disliked Games */}
      <div className="mt-8">
        <div className="mb-6 flex items-center justify-end">
          <Link href="/explore">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-zinc-600 bg-zinc-800 text-gray-300 hover:bg-zinc-700 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm">{t('homepage_explore_more')}</span>
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-5">
          {dissGameData.slice(5, 10).map((game, index) => {
            // Convert DissGameEntry to GameDbData format for MiniGameCard
            const gameData = {
              id: parseInt(game.id),
              igdb_id: parseInt(game.id),
              name: game.title,
              slug: game.slug,
              cover_url: game.bannerUrl,
              banner_url: game.bannerUrl,
              developers: game.developer ? [game.developer] : null,
              platforms: [], // We don't have platform data in DissGameEntry
              first_release_date: null, // We don't have release date in DissGameEntry
              dislike_count: game.dislikeCount,
            };

            return (
              <MiniGameCard
                key={game.id}
                game={gameData}
                ranking={index + 6} // 6-10 becomes 7-11 for display
              />
            );
          })}

          {/* View More Card - Only visible on mobile/tablet (< lg) */}
          <div className="block lg:hidden">
            <MiniGameCard
              placeholder={{
                title: t('homepage_view_more'),
                description: t('homepage_explore_all_games'),
                href: '/explore',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopDislikeGames;
