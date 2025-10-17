'use client';

import { useState, useEffect } from 'react';
import {
  ThumbsDown,
  Loader2,
  Share2,
  Gamepad2,
  Calendar,
  Users,
  Ghost,
  MonitorX,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import NumberFlow from '@number-flow/react';

// API response interface
interface RankingData {
  currentGame: {
    id: number;
    name: string;
    slug: string;
    dislike_count: number;
    rank: number | null;
  };
}

interface GameDetailHeadlineProps {
  gameId: number;
  gameName: string;
  gameCoverUrl?: string;
  gameReleaseDate?: number;
  dislikeCount: number;
  isDeadGame?: boolean;
  deadDate?: string;
  deadStatus?: 'Shutdown' | 'Abandoned';
  ghostCount?: number;
}

const GameDetailHeadline = ({
  gameId,
  gameName,
  gameCoverUrl,
  gameReleaseDate,
  dislikeCount,
  isDeadGame = false,
  deadDate,
  deadStatus,
  ghostCount = 0,
}: GameDetailHeadlineProps) => {
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dislikedUsersCount, setDislikedUsersCount] = useState<number>(0);
  const [isLoadingUsersCount, setIsLoadingUsersCount] = useState(true);

  const getRankingColor = (rank: number | null | undefined) => {
    if (!rank) return 'yellow';
    if (rank <= 5) return 'red';
    if (rank <= 15) return 'orange';
    return 'yellow';
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  useEffect(() => {
    // Skip fetching ranking data for dead games
    if (isDeadGame) {
      setIsLoading(false);
      setIsLoadingUsersCount(false);
      return;
    }

    async function fetchRankingData() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/games/${gameId}/ranking`);

        if (!response.ok) {
          throw new Error('Failed to fetch ranking data');
        }

        const data = await response.json();
        setRankingData(data);
      } catch (err) {
        console.error('Error fetching ranking data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load ranking data',
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchRankingData();
  }, [gameId, isDeadGame]);

  useEffect(() => {
    // Skip fetching user counts for dead games
    if (isDeadGame) {
      setIsLoadingUsersCount(false);
      return;
    }

    async function fetchDislikedUsersCount() {
      try {
        setIsLoadingUsersCount(true);
        const response = await fetch(
          `/api/games/disliked-users-count?gameId=${gameId}`,
        );
        const result = await response.json();

        if (result.success) {
          setDislikedUsersCount(result.data.dislikedUsersCount);
        }
      } catch (err) {
        console.error('Failed to fetch disliked users count:', err);
      } finally {
        setIsLoadingUsersCount(false);
      }
    }

    fetchDislikedUsersCount();
  }, [gameId, isDeadGame]);

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="p-6">
          <div className="flex items-center gap-4">
            {/* Skeleton Avatar */}
            <div className="h-18 w-18 flex-shrink-0 animate-pulse rounded-full bg-gray-700" />

            {/* Skeleton Content */}
            <div className="flex flex-1 flex-col gap-6">
              <div className="h-8 w-64 animate-pulse rounded bg-gray-700" />
              <div className="flex items-center gap-4">
                <div className="h-5 w-24 animate-pulse rounded bg-gray-700" />
                <div className="h-5 w-32 animate-pulse rounded bg-gray-700" />
                <div className="h-5 w-28 animate-pulse rounded bg-gray-700" />
              </div>
            </div>

            {/* Skeleton Button */}
            <div className="h-10 w-24 animate-pulse rounded bg-gray-700" />
          </div>
        </div>
      </section>
    );
  }

  // For dead games, skip error check for ranking data
  if (!isDeadGame && (error || !rankingData)) {
    return (
      <section className="mb-8">
        <div className="p-6">
          <div className="text-center text-gray-400">
            {error || 'Failed to load ranking data'}
          </div>
        </div>
      </section>
    );
  }

  // Format dead date
  const formattedDeadDate = deadDate
    ? (() => {
        const date = new Date(deadDate);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
      })()
    : '';

  return (
    <section className="mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between">
          {/* Left: Game Info + Ranking Info */}
          <div className="flex items-center gap-4">
            {/* Game Avatar */}
            <div
              className={`flex-shrink-0 rounded-full border-2 border-${getRankingColor(rankingData?.currentGame.rank)}-600 p-1`}
            >
              {gameCoverUrl ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                  <Image
                    src={gameCoverUrl}
                    alt={`${gameName} avatar`}
                    fill
                    sizes="64px"
                    className="rounded-full object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
                  <Gamepad2 className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </div>
              )}
            </div>

            {/* Game Title */}
            <div className="flex flex-col gap-1">
              <h1 className="mb-1 text-2xl font-bold text-white">{gameName}</h1>
              <div className="flex items-center gap-4">
                {isDeadGame ? (
                  <>
                    {/* Release Date */}
                    {gameReleaseDate && (
                      <>
                        <div className="h-4 w-px bg-gray-700/50" />
                        <div className="flex items-center gap-2">
                          <Calendar
                            className={`h-4 w-4 ${isDeadGame ? 'text-grey-400' : 'text-blue-400'}`}
                          />
                          <span className="text-sm text-gray-400">
                            Released{' '}
                            {new Date(gameReleaseDate).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="h-4 w-px bg-gray-700/50" />

                    {/* Dead Game Info */}
                    <div className="flex items-center gap-2">
                      <MonitorX className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-400">
                        {deadStatus} {formattedDeadDate}
                      </span>
                    </div>

                    <div className="h-4 w-px bg-gray-700/50" />

                    {/* Ghost Count */}
                    <div className="flex items-center gap-2">
                      <Ghost className="h-4 w-4 text-zinc-300" />
                      <span className="text-lg font-bold text-zinc-300">
                        <NumberFlow value={ghostCount} />
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Normal Game Info - Ranking Display */}
                    {rankingData?.currentGame.rank ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-sm font-bold text-white bg-${getRankingColor(rankingData.currentGame.rank)}-600 hover:bg-${getRankingColor(rankingData.currentGame.rank)}-600`}
                        >
                          #{rankingData.currentGame.rank}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {'of top 100 most disliked'}
                        </span>
                      </div>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex cursor-help items-center gap-2">
                              <Badge className="bg-green-600 text-sm font-bold text-white hover:bg-green-600">
                                Outside Top 100
                              </Badge>
                              <span className="text-sm text-gray-400">
                                This game is not that bad
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              This game is not among the 100 most disliked games
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <div className="h-4 w-px bg-red-700/50" />

                    {/* Dislike Count */}
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-400" />
                      <span className="text-lg font-bold text-red-400">
                        <NumberFlow value={dislikeCount || 0} />
                      </span>
                    </div>

                    {/* Disliked User Count */}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-yellow-500" />
                      {isLoadingUsersCount ? (
                        <Loader2 className="inline h-3 w-3 animate-spin" />
                      ) : (
                        <p className="text-sm font-bold text-yellow-500">
                          {dislikedUsersCount}
                        </p>
                      )}
                    </div>

                    {/* Release Date */}
                    {gameReleaseDate && (
                      <>
                        <div className="h-4 w-px bg-red-700/50" />
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <span className="text-sm text-gray-400">
                            Released{' '}
                            {new Date(gameReleaseDate).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            <Button onClick={handleShare} variant="outline">
              <Share2 className="mr-1 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameDetailHeadline;
