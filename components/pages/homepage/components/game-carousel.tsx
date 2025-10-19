'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ThumbsDown, Gamepad2 } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { motion } from 'framer-motion';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import type { DissGameEntry } from '../hooks/use-top-disliked-games';

interface GameCarouselProps {
  games: DissGameEntry[];
  activeIndex: number;
  clickingButtons: Set<string>;
  onApiReady: (api: any) => void;
  onVote: (gameId: string) => void;
}

export function GameCarousel({
  games,
  activeIndex,
  clickingButtons,
  onApiReady,
  onVote,
}: GameCarouselProps) {
  return (
    <Carousel
      opts={{
        loop: true,
        align: 'start',
      }}
      className="w-full"
      setApi={onApiReady}
    >
      <CarouselContent>
        {games.slice(0, 5).map((game) => (
          <CarouselItem key={game.id}>
            <div className="game-card relative aspect-[16/9] overflow-hidden rounded-lg">
              <Link href={`/detail/${game.slug}`}>
                <div className="absolute inset-0 cursor-pointer transition-transform hover:scale-[1.02]">
                  <div className="absolute top-4 left-4 z-20 rounded-lg bg-black/70 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-400" />
                      <span className="font-bold text-white">
                        <NumberFlow value={game.dislikeCount} />
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-red-600 font-bold text-white">
                    #{game.rank}
                  </div>

                  {game.bannerUrl ? (
                    <Image
                      src={game.bannerUrl}
                      alt={`Banner image for ${game.title}`}
                      width={1920}
                      height={1080}
                      className="h-full w-full object-cover"
                      priority={activeIndex === games.indexOf(game)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                      <Gamepad2 size={60} className="text-gray-500" />
                    </div>
                  )}
                </div>
              </Link>

              {/* Dislike Button - Bottom Right */}
              <motion.div
                className="absolute right-4 bottom-4 z-20 block lg:hidden"
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
                  size="lg"
                  className="h-10 w-10 bg-red-500 p-0 shadow-lg transition-all hover:scale-110 hover:bg-red-600"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onVote(game.id);
                  }}
                >
                  <ThumbsDown className="h-5 w-5 text-white" />
                </Button>
              </motion.div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
