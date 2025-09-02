import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import PaginationDots from '@/components/shared/pagination-dots';
import MiniGameCard from '@/components/shared/cards/mini-game-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, TrendingUp } from 'lucide-react';
import type { GameDbData } from '@/types';

interface UpcomingGamesResponse {
  success: boolean;
  data: GameDbData[];
  total: number;
}

const fetcher = async (url: string): Promise<UpcomingGamesResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch upcoming games');
  return res.json();
};

const UpcomingGameSkeleton = () => (
  <div className="w-full">
    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg">
      <Skeleton className="h-full w-full bg-zinc-700" />
    </div>
    <div className="mt-3 space-y-2">
      <Skeleton className="h-4 w-3/4 bg-zinc-700" />
      <Skeleton className="h-3 w-1/2 bg-zinc-700" />
      <div className="flex gap-1">
        <Skeleton className="h-5 w-12 bg-zinc-700" />
        <Skeleton className="h-5 w-16 bg-zinc-700" />
      </div>
    </div>
  </div>
);

const UpcomingGames = () => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data, error, isLoading } = useSWR<UpcomingGamesResponse>(
    '/api/upcoming-games',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    },
  );

  if (error) {
    return (
      <section className="mb-12">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-400">
          Failed to load upcoming games. Please try again later.
        </div>
      </section>
    );
  }

  if (isLoading || !data) {
    return (
      <section className="mb-12">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
            </div>
          </div>
        </div>

        <div className="relative overflow-visible">
          <div className="-ml-2 flex gap-2 overflow-visible md:-ml-4 md:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="basis-[280px] pt-4 pb-6 pl-2 sm:basis-1/2 md:basis-1/3 md:pl-4 lg:basis-1/5 xl:basis-1/6"
              >
                <UpcomingGameSkeleton />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data.data || data.data.length === 0) {
    return (
      <section className="mb-12">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-8 text-center text-zinc-400">
          <Calendar size={48} className="mx-auto mb-4 text-zinc-600" />
          <p className="text-lg font-medium">No upcoming games yet</p>
          <p className="text-sm">Check back later for exciting new releases!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      {/* Enhanced Section Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-white" />
          <div>
            <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
          </div>
        </div>

        {/* TODO: Add view all button */}
        <div className="hidden cursor-pointer items-center gap-2 text-zinc-400 transition-colors hover:text-white md:flex">
          <TrendingUp size={16} />
          <span className="text-sm font-medium">View All</span>
        </div>
      </div>

      {/* Enhanced Carousel */}
      <div className="relative overflow-visible">
        <Carousel
          setApi={(apiInstance) => {
            setCarouselApi(apiInstance);
            if (apiInstance) {
              apiInstance.on('select', () => {
                if (apiInstance) {
                  setActiveIndex(apiInstance.selectedScrollSnap());
                }
              });
              // Set initial activeIndex
              setActiveIndex(apiInstance.selectedScrollSnap());
            }
          }}
          opts={{
            align: 'start',
            slidesToScroll: 1,
          }}
          className="w-full overflow-visible"
        >
          <CarouselContent className="-ml-2 overflow-visible md:-ml-4">
            {data.data.map((game) => (
              <CarouselItem
                key={`upcoming-${game.id}`}
                className="basis-[280px] pt-4 pb-6 pl-2 sm:basis-1/2 md:basis-1/3 md:pl-4 lg:basis-1/5 xl:basis-1/6"
              >
                <MiniGameCard game={game} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Mobile Pagination Dots */}
        <div className="mt-6 flex items-center justify-center sm:hidden">
          <PaginationDots
            totalItems={data.data.length}
            activeIndex={activeIndex}
            carouselApi={carouselApi}
          />
        </div>
      </div>
    </section>
  );
};

export default UpcomingGames;
