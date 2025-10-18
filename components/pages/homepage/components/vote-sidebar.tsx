'use client';

import Image from 'next/image';
import { ThumbsDown, Gamepad2 } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { GameOverEntry } from '../hooks/use-top-disliked-games';

interface TopDislikedGame {
  id: number;
  igdb_id: number;
  name: string;
  slug: string;
  cover_url: string | null;
  banner_url: string | null;
  developers: string[] | null;
  dislike_count: number;
}

interface VoteSidebarProps {
  games: GameOverEntry[];
  topDislikedGamesData: TopDislikedGame[] | undefined;
  activeIndex: number;
  clickingButtons: Set<string>;
  thumbnailRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  onGameClick: (index: number) => void;
  onVote: (gameId: string) => void;
}

export function VoteSidebar({
  games,
  topDislikedGamesData,
  activeIndex,
  clickingButtons,
  thumbnailRefs,
  onGameClick,
  onVote,
}: VoteSidebarProps) {
  return (
    <div className="relative hidden overflow-hidden rounded-lg bg-zinc-800 p-4 lg:block">
      <div className="mb-4">
        <h3 className="mb-2 font-bold text-red-400">Top 5 Disliked Games</h3>
        <p className="text-xs text-gray-400">
          Cast your vote to increase the shame!
        </p>
      </div>

      <div className="space-y-4">
        {games.slice(0, 5).map((game, index) => {
          const topDislikedGame = topDislikedGamesData?.find(
            (tdg) => tdg.igdb_id.toString() === game.id,
          );
          const coverUrl = topDislikedGame?.cover_url;

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
              onClick={() => onGameClick(index)}
            >
              <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                #{game.rank}
              </div>

              <div className="flex items-center gap-3">
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
                      <Gamepad2 size={20} className="text-gray-500" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-medium">{game.title}</h4>
                  <div className="mt-1 flex items-center gap-1 text-red-400">
                    <ThumbsDown size={12} />
                    <span className="text-xs font-bold">
                      <NumberFlow value={game.dislikeCount} />
                    </span>
                  </div>
                </div>

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
                    className="relative h-8 w-8 flex-shrink-0 bg-red-500 p-0 transition-all hover:scale-110 hover:bg-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote(game.id);
                    }}
                  >
                    <ThumbsDown className="text-white" />
                  </Button>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
