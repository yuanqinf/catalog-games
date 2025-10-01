'use client';

import { useState, useEffect } from 'react';
import { ThumbsDown, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
}

const GameDetailHeadline = ({ gameId, gameName }: GameDetailHeadlineProps) => {
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <Card className="border-red-800/50 bg-gradient-to-r from-red-900/20 to-red-800/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-red-400" />
              <span className="ml-2 text-gray-300">
                Loading ranking data...
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (error || !rankingData) {
    return (
      <section className="mb-8">
        <Card className="border-red-800/50 bg-gradient-to-r from-red-900/20 to-red-800/10">
          <CardContent className="p-6">
            <div className="text-center text-gray-400">
              {error || 'Failed to load ranking data'}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <Card className="border-red-800/50 bg-gradient-to-r from-red-900/20 to-red-800/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            {/* Ranking Info */}
            <div className="flex items-center gap-6">
              {/* Ranking Display */}
              <div className="flex items-center gap-3">
                {rankingData.currentGame.rank ? (
                  <>
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
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Rank #{rankingData.currentGame.rank}
                      </h2>
                      <p className="text-sm text-gray-400">
                        of top 100 most disliked
                      </p>
                    </div>
                  </>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex cursor-help items-center gap-3">
                          <Badge className="bg-green-600 text-sm font-bold text-white hover:bg-green-600">
                            Outside Top 100
                          </Badge>
                          <div>
                            <h2 className="text-xl font-bold text-green-400">
                              Not in Top 100
                            </h2>
                            <p className="text-sm text-gray-400">
                              This game is not that bad
                            </p>
                          </div>
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
              </div>

              <div className="h-12 w-px bg-red-700/50" />

              {/* Dislike Count */}
              <div className="flex items-center gap-3">
                <ThumbsDown className="h-8 w-8 text-red-400" />
                <div>
                  <h3 className="text-xl font-bold text-red-400">
                    {rankingData.currentGame.dislike_count?.toLocaleString() ||
                      '0'}
                  </h3>
                  <p className="text-sm text-gray-400">total dislikes</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default GameDetailHeadline;
