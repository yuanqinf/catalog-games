'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ThumbsDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DynamicTrendChart from '@/components/shared/cards/dynamic-trend-chart';
import CatalogRating from '@/components/shared/catelog-rating/catalog-rating';
import SteamReviewBadge from '@/components/shared/steam-review-badge';

import { useGameRating } from '@/hooks/useGameRating';
import { useSteamReviews } from '@/hooks/useSteamReviews';
import { GameDbData } from '@/types';

interface GameDetailHighlightProps {
  game: GameDbData;
  dislikeCount: number;
  userDislikeCount: number;
  isDislikeLoading: boolean;
  clickingButton: boolean;
  userVoteState: {
    continuousClicks: number;
    lastClickTime: number;
    isPowerMode: boolean;
  };
  onDislikeVote: () => void;
}

export default function GameDetailHighlight({
  game,
  dislikeCount,
  userDislikeCount,
  isDislikeLoading,
  clickingButton,
  userVoteState,
  onDislikeVote,
}: GameDetailHighlightProps) {
  const {
    rating,
    overallAverage,
    isLoading: isLoadingRating,
  } = useGameRating(game.id);

  // Fetch real-time Steam reviews (client-side only)
  const { steamReviews } = useSteamReviews(game.name);

  return (
    <div className="space-y-6 lg:col-span-1">
      {/* Reaction Panel */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between">
          {/* Left side: Dislike count and user number */}
          <div className="flex flex-col">
            <div className="mb-1 flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-400" />
              <span className="text-2xl font-bold text-white">
                {dislikeCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-zinc-400">
              <Users className="h-3 w-3" />
              <span>{userDislikeCount.toLocaleString()} users</span>
            </div>
          </div>

          {/* Right side: Square dislike button */}
          <motion.div
            animate={clickingButton ? { scale: [1, 0.8, 1.1, 1] } : {}}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={onDislikeVote}
              disabled={isDislikeLoading}
              className={`h-12 w-12 bg-red-600 p-0 text-white hover:bg-red-700 ${
                userVoteState.isPowerMode ? 'shadow-lg shadow-red-500/50' : ''
              }`}
              size="sm"
            >
              <ThumbsDown className="h-5 w-5" />
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

        {userVoteState.isPowerMode && (
          <div className="mt-2 animate-pulse text-center text-xs text-red-400">
            🔥 POWER MODE ACTIVE! 🔥
          </div>
        )}
      </div>

      <div>
        <DynamicTrendChart keyword={game.name} hideYAxis hideXAxis />
      </div>

      <div className="highlight-card-section">
        <CatalogRating
          rating={rating}
          gameId={game.id?.toString()}
          isLoading={isLoadingRating}
          isUpcoming={
            game.first_release_date
              ? new Date(game.first_release_date) > new Date()
              : false
          }
        />
      </div>

      <div className="highlight-card-footer">
        {/* Catalog User Rating */}
        <div
          title={`Catalog User Rating: ${overallAverage}`}
          className="flex items-center"
        >
          <Image
            src="/images/logo.png"
            alt="Catalog Logo"
            width={24}
            height={24}
            className="mr-1"
          />
          <span className="mr-2 hidden sm:inline-block">Catalog Rating: </span>
          <span className="font-semibold text-neutral-200">
            {overallAverage ? overallAverage : 'N/A'}
          </span>
        </div>

        {/* IGDB Score */}
        <div title={`IGDB User Rating: ${game.igdb_user_rating}`}>
          <span className="mr-1 hidden sm:inline-block">
            IGDB User Rating:{' '}
          </span>
          <span className="font-semibold text-neutral-200">
            {game.igdb_user_rating ? game.igdb_user_rating : 'N/A'}
          </span>
        </div>

        {/* Steam Review - client-side real-time data only with slide-in animation */}
        <div
          className={`transition-all duration-500 ease-out ${
            steamReviews?.steam_all_review
              ? 'translate-x-0 opacity-100'
              : 'translate-x-4 opacity-0'
          }`}
        >
          <SteamReviewBadge
            review={steamReviews?.steam_all_review ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
