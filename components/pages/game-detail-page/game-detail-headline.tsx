'use client';

import { useState, useEffect } from 'react';
import {
  ThumbsDown,
  Loader2,
  Bookmark,
  BookmarkCheck,
  Share2,
  Gamepad2,
  Calendar,
  Users,
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
}

const GameDetailHeadline = ({
  gameId,
  gameName,
  gameCoverUrl,
  gameReleaseDate,
  dislikeCount,
}: GameDetailHeadlineProps) => {
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [dislikedUsersCount, setDislikedUsersCount] = useState<number>(0);
  const [isLoadingUsersCount, setIsLoadingUsersCount] = useState(true);

  const getRankingColor = (rank: number | null) => {
    if (!rank) return 'yellow';
    if (rank <= 5) return 'red';
    if (rank <= 15) return 'orange';
    return 'yellow';
  };

  // Placeholder handlers for buttons
  const handleFollow = () => {
    setIsBookmarked(!isBookmarked);
    console.log(`${isBookmarked ? 'Unfollowed' : 'Followed'} game:`, gameName);
    // TODO: Implement follow functionality
  };

  const handleShare = () => {
    console.log('Share button clicked for game:', gameName);
    // TODO: Implement share functionality
  };

  useEffect(() => {
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
  }, [gameId]);

  useEffect(() => {
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
  }, [gameId]);

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-red-400" />
            <span className="ml-2 text-gray-300">Loading ranking data...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error || !rankingData) {
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
                {/* Ranking Display */}
                {rankingData.currentGame.rank ? (
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
                    {dislikeCount?.toLocaleString() || '0'}
                  </span>
                  <span className="text-sm text-gray-400">dislikes</span>
                </div>

                {/* Disliked User Count */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-400" />
                  <span className="text-sm text-gray-400">
                    {isLoadingUsersCount ? (
                      <Loader2 className="inline h-3 w-3 animate-spin" />
                    ) : (
                      `${dislikedUsersCount.toLocaleString()} ${dislikedUsersCount === 1 ? 'user' : 'users'}`
                    )}
                  </span>
                </div>

                {/* Release Date */}
                {gameReleaseDate && (
                  <>
                    <div className="h-4 w-px bg-red-700/50" />
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-gray-400">
                        {(() => {
                          const releaseDate = new Date(gameReleaseDate);
                          const now = new Date();
                          const isFuture = releaseDate > now;
                          return isFuture
                            ? `Expected ${releaseDate.toLocaleDateString()}`
                            : `Released ${releaseDate.toLocaleDateString()}`;
                        })()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            <Button onClick={handleFollow} variant="outline">
              {isBookmarked ? (
                <BookmarkCheck className="mr-2 h-4 w-4" />
              ) : (
                <Bookmark className="mr-2 h-4 w-4" />
              )}
              {isBookmarked ? 'Following' : 'Follow'}
            </Button>
            <Button onClick={handleShare} variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameDetailHeadline;
