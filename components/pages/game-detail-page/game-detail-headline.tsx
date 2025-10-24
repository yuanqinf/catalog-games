'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ThumbsDown, Gamepad2, Calendar, Ghost, MonitorX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import NumberFlow from '@number-flow/react';
import { useTranslation } from '@/lib/i18n/client';

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
  const { t } = useTranslation();
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getRankingColor = (rank: number | null | undefined) => {
    if (!rank) return 'yellow';
    if (rank <= 5) return 'red';
    if (rank <= 15) return 'orange';
    return 'yellow';
  };

  useEffect(() => {
    // Skip fetching ranking data for dead games
    if (isDeadGame) {
      setIsLoading(false);
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
            {error || t('game_detail_failed_load_ranking')}
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
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Game Info + Ranking Info */}
          <div className="flex items-start gap-3 sm:items-center sm:gap-4">
            {/* Game Avatar */}
            <div
              className={`flex-shrink-0 rounded-full border-2 border-${getRankingColor(rankingData?.currentGame.rank)}-600 p-1`}
            >
              {gameCoverUrl ? (
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gray-200 sm:h-16 sm:w-16 dark:bg-gray-800">
                  <Image
                    src={gameCoverUrl}
                    alt={`${gameName} avatar`}
                    fill
                    sizes="(max-width: 640px) 48px, 64px"
                    className="rounded-full object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 sm:h-16 sm:w-16 dark:bg-gray-800">
                  <Gamepad2 className="h-5 w-5 text-gray-500 sm:h-6 sm:w-6 dark:text-gray-400" />
                </div>
              )}
            </div>

            {/* Game Title */}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h1 className="mb-1 truncate text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                {gameName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                {isDeadGame ? (
                  <>
                    {/* Release Date */}
                    {gameReleaseDate && (
                      <>
                        <div className="hidden h-4 w-px bg-gray-700/50 sm:block" />
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Calendar
                            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isDeadGame ? 'text-grey-400' : 'text-blue-400'}`}
                          />
                          <span className="text-xs text-gray-400 sm:text-sm">
                            {t('game_detail_released')}
                            {new Date(gameReleaseDate).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="hidden h-4 w-px bg-gray-700/50 sm:block" />

                    {/* Dead Game Info */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <MonitorX className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
                      <span className="text-xs font-medium text-gray-400 sm:text-sm">
                        {deadStatus} {formattedDeadDate}
                      </span>
                    </div>

                    <div className="hidden h-4 w-px bg-gray-700/50 sm:block" />

                    {/* Ghost Count */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Ghost className="h-3.5 w-3.5 text-gray-300 sm:h-4 sm:w-4" />
                      <span className="text-base font-bold text-gray-300 sm:text-lg">
                        <NumberFlow value={ghostCount} />
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Normal Game Info - Ranking Display */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Badge
                        className={`text-xs font-bold text-white sm:text-sm ${
                          rankingData?.currentGame.rank
                            ? `bg-${getRankingColor(rankingData.currentGame.rank)}-600 hover:bg-${getRankingColor(rankingData.currentGame.rank)}-600`
                            : 'bg-green-600 hover:bg-green-600'
                        }`}
                      >
                        {rankingData?.currentGame.rank
                          ? `#${rankingData.currentGame.rank}`
                          : t('game_detail_outside_top_100')}
                      </Badge>
                      <span className="hidden text-sm text-gray-400 sm:inline">
                        {rankingData?.currentGame.rank
                          ? t('game_detail_of_top_100_disliked')
                          : t('game_detail_not_that_bad')}
                      </span>
                    </div>

                    <div className="hidden h-4 w-px bg-red-700/50 sm:block" />

                    {/* Dislike Count */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <ThumbsDown className="h-3.5 w-3.5 text-red-400 sm:h-4 sm:w-4" />
                      <span className="text-base font-bold text-red-400 sm:text-lg">
                        <NumberFlow value={dislikeCount || 0} />
                      </span>
                    </div>

                    {/* Release Date */}
                    {gameReleaseDate && (
                      <>
                        <div className="hidden h-4 w-px bg-red-700/50 sm:block" />
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Calendar className="h-3.5 w-3.5 text-blue-400 sm:h-4 sm:w-4" />
                          <span className="text-xs text-gray-400 sm:text-sm">
                            {t('game_detail_released')}
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
        </div>
      </div>
    </section>
  );
};

export default GameDetailHeadline;
