'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ThumbsDown, Angry, Loader2, LucideIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DynamicTrendChart from '@/components/shared/cards/dynamic-trend-chart';
import CatalogRating from '@/components/shared/catelog-rating/catalog-rating';
import NumberFlow from '@number-flow/react';

import { useGameRating } from '@/hooks/useGameRating';
import { GameDbData } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface StatisticItem {
  title: string;
  value: string;
  icon: LucideIcon;
  tooltipContent?: React.ReactNode;
}

interface GameDetailHighlightProps {
  game: GameDbData;
  dislikeCount: number;
  userDislikeCount: number;
  isLoadingUserDislike: boolean;
  clickingButton: boolean;
  userVoteState: {
    continuousClicks: number;
    lastClickTime: number;
    isPowerMode: boolean;
  };
  onDislikeVote: () => void;
  statistics?: StatisticItem[];
  isLoadingStatistics?: boolean;
}

export default function GameDetailHighlight({
  game,
  dislikeCount,
  userDislikeCount,
  isLoadingUserDislike,
  clickingButton,
  userVoteState,
  onDislikeVote,
  statistics = [],
  isLoadingStatistics = false,
}: GameDetailHighlightProps) {
  const {
    rating,
    overallAverage,
    isLoading: isLoadingRating,
  } = useGameRating(game.id);

  return (
    <div className="space-y-6 lg:col-span-1">
      {/* Reaction Panel */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between">
          {/* Left side: Dislike counts in one line */}
          <div className="flex items-center gap-3">
            {/* Total Dislike Count */}
            <div className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-400" />
              <span className="text-2xl font-bold text-white">
                <NumberFlow value={dislikeCount} />
              </span>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-zinc-700" />

            {/* User's Dislike Count */}
            <div className="flex items-center gap-2">
              <Angry className="h-4 w-4 text-orange-400" />
              {isLoadingUserDislike ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              ) : (
                <span className="text-lg font-semibold text-orange-400">
                  <NumberFlow value={userDislikeCount} />
                </span>
              )}
              <span className="text-xs text-zinc-500">yours</span>
            </div>
          </div>

          {/* Right side: Square dislike button */}
          <motion.div
            animate={clickingButton ? { scale: [1, 0.8, 1.1, 1] } : {}}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={onDislikeVote}
              className={`h-12 w-12 bg-red-600 p-0 text-white hover:bg-red-700 ${
                userVoteState.isPowerMode ? 'shadow-lg shadow-red-500/50' : ''
              }`}
              size="sm"
            >
              <ThumbsDown className="!h-5 !w-5" />
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

      <div>
        <DynamicTrendChart keyword={game.name} hideYAxis hideXAxis />
      </div>

      {/* Statistics Section */}
      {(statistics.length > 0 || isLoadingStatistics) && (
        <div>
          {isLoadingStatistics ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="space-y-3"
            >
              {statistics.map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      ease: 'easeOut',
                      delay: index * 0.05,
                    }}
                    className="flex items-center justify-between rounded-md border border-zinc-700/50 bg-zinc-800/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-zinc-700/50 p-2">
                        <Icon className="h-4 w-4 text-zinc-300" />
                      </div>
                      <span className="text-sm text-zinc-400">
                        {stat.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-white">
                        {stat.value}
                      </span>
                      {stat.tooltipContent && (
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 cursor-pointer text-zinc-500 hover:text-zinc-300" />
                            </TooltipTrigger>
                            <TooltipContent>
                              {stat.tooltipContent}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}

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
      </div>
    </div>
  );
}
