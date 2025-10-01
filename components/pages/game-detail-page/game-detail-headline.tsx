'use client';

import { useState, useEffect } from 'react';
import { ThumbsDown, Loader2, Bookmark, Share2, Gamepad2 } from 'lucide-react';
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
}

const GameDetailHeadline = ({
  gameId,
  gameName,
  gameCoverUrl,
}: GameDetailHeadlineProps) => {
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Placeholder handlers for buttons
  const handleFollow = () => {
    console.log('Follow button clicked for game:', gameName);
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
          <div className="flex items-center gap-6">
            {/* Game Avatar */}
            <div className="flex-shrink-0 rounded-full border-2 border-red-500 p-1">
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
            <div>
              <h1 className="mb-1 text-2xl font-bold text-white">{gameName}</h1>
              <div className="flex items-center gap-4">
                {/* Ranking Display */}
                {rankingData.currentGame.rank ? (
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-sm font-bold text-white ${
                        rankingData.currentGame.rank <= 5
                          ? 'bg-red-600 hover:bg-red-600'
                          : rankingData.currentGame.rank <= 15
                            ? 'bg-orange-600 hover:bg-orange-600'
                            : 'bg-yellow-600 hover:bg-yellow-600'
                      }`}
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
                    {rankingData.currentGame.dislike_count?.toLocaleString() ||
                      '0'}
                  </span>
                  <span className="text-sm text-gray-400">dislikes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleFollow}
              variant="outline"
              className="border-red-700/50 text-gray-300 hover:border-red-600 hover:bg-red-900/20 hover:text-white"
            >
              <Bookmark className="mr-2 h-4 w-4" />
              Follow
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-red-700/50 text-gray-300 hover:border-red-600 hover:bg-red-900/20 hover:text-white"
            >
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
