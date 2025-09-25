'use client';

import { useState } from 'react';
import { ThumbsDown, ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Ranking data interface
interface RankingData {
  currentRank: number;
  dislikeCount: number;
  totalGames: number;
  previousGame?: {
    name: string;
    rank: number;
    slug: string;
  };
  nextGame?: {
    name: string;
    rank: number;
    slug: string;
  };
}

interface GameDetailHeadlineProps {
  gameId: number;
  gameName: string;
}

const GameDetailHeadline = ({ gameId, gameName }: GameDetailHeadlineProps) => {
  // Mock ranking data - replace with real API call
  const [rankingData] = useState<RankingData>({
    currentRank: Math.floor(Math.random() * 100) + 1,
    dislikeCount: Math.floor(Math.random() * 50000) + 10000,
    totalGames: 150,
    previousGame: {
      name: 'Cyberpunk 2077',
      rank: Math.floor(Math.random() * 100),
      slug: 'cyberpunk-2077',
    },
    nextGame: {
      name: 'FIFA 24',
      rank: Math.floor(Math.random() * 100) + 2,
      slug: 'fifa-24',
    },
  });

  const handleNavigation = (slug: string) => {
    window.location.href = `/detail/${slug}`;
  };

  return (
    <section className="mb-8">
      <Card className="bg-gradient-to-r from-red-900/20 to-red-800/10 border-red-800/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {/* Left: Ranking Info */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Crown className="h-8 w-8 text-yellow-500" />
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    #{rankingData.currentRank}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Rank #{rankingData.currentRank}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    of {rankingData.totalGames} games
                  </p>
                </div>
              </div>

              <div className="h-12 w-px bg-red-700/50" />

              <div className="flex items-center gap-3">
                <ThumbsDown className="h-8 w-8 text-red-400" />
                <div>
                  <h3 className="text-2xl font-bold text-red-400">
                    {rankingData.dislikeCount.toLocaleString()}
                  </h3>
                  <p className="text-gray-400 text-sm">total dislikes</p>
                </div>
              </div>
            </div>

            {/* Right: Navigation */}
            <div className="flex items-center gap-4">
              {/* Previous Game */}
              {rankingData.previousGame && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-700/50 hover:border-red-600 hover:bg-red-900/20 text-gray-300 hover:text-white"
                  onClick={() => handleNavigation(rankingData.previousGame!.slug)}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="text-xs text-gray-400">
                      #{rankingData.previousGame.rank}
                    </div>
                    <div className="text-sm font-medium truncate max-w-24">
                      {rankingData.previousGame.name}
                    </div>
                  </div>
                </Button>
              )}

              {/* Next Game */}
              {rankingData.nextGame && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-700/50 hover:border-red-600 hover:bg-red-900/20 text-gray-300 hover:text-white"
                  onClick={() => handleNavigation(rankingData.nextGame!.slug)}
                >
                  <div className="text-right">
                    <div className="text-xs text-gray-400">
                      #{rankingData.nextGame.rank}
                    </div>
                    <div className="text-sm font-medium truncate max-w-24">
                      {rankingData.nextGame.name}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default GameDetailHeadline;
