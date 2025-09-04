import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import { Bookmark, Gamepad2, Star } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import PaginationDots from '@/components/shared/pagination-dots';

// Types for hero games data
interface HeroGame {
  id: number;
  game_id: number;
  added_at: string;
  games: {
    id: number;
    name: string;
    slug: string;
    cover_url: string | null;
    banner_url: string | null;
    developers: string[] | null;
    igdb_id: number;
  };
}

interface HeroGamesResponse {
  success: boolean;
  data: HeroGame[];
  error?: string;
}

const HeroGames = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch hero games data
  const {
    data: heroGamesResponse,
    error,
    isLoading,
  } = useSWR<HeroGamesResponse>(
    '/api/hero-games',
    (url) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch hero games');
        return res.json();
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes cache
    },
  );

  // Transform hero games data to match the expected format
  const transformedGames =
    heroGamesResponse?.data?.map((heroGame) => ({
      id: heroGame.games.igdb_id,
      name: heroGame.games.name,
      developer: heroGame.games.developers?.[0] || 'Unknown Developer',
      images: {
        banner: heroGame.games.banner_url || heroGame.games.cover_url || '',
        thumbnail: heroGame.games.cover_url || '',
      },
      slug: heroGame.games.slug,
    })) || [];

  // Scroll the active thumbnail into view when activeIndex changes
  useEffect(() => {
    if (thumbnailRefs.current[activeIndex] && transformedGames.length > 0) {
      thumbnailRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeIndex, transformedGames.length]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <section className="relative mb-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Main Carousel Skeleton */}
        <div className="relative lg:col-span-3">
          <Skeleton className="aspect-[16/9] w-full rounded-lg" />
        </div>

        {/* Sidebar Skeleton */}
        <div className="hidden h-full rounded-lg bg-zinc-800 p-4 lg:block">
          <div className="grid h-full grid-rows-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-md p-2"
              >
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  // Error state
  if (error) {
    return (
      <section className="relative mb-12">
        <div className="flex h-64 items-center justify-center rounded-lg border border-red-800 bg-red-900/20 text-red-400">
          <div className="text-center">
            <p className="mb-2">Failed to load hero games</p>
            <p className="text-sm opacity-75">Please try again later</p>
          </div>
        </div>
      </section>
    );
  }

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Empty state
  if (!transformedGames || transformedGames.length === 0) {
    return (
      <section className="relative mb-12">
        <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-400">
          <div className="text-center">
            <Gamepad2 size={48} className="mx-auto mb-4 opacity-50" />
            <p className="mb-2">No hero games available</p>
            <p className="text-sm opacity-75">
              Hero games will appear here once added by admins
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative mb-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Main Carousel - Takes 3/4 of the width on large screens */}
        <div className="relative lg:col-span-3">
          <Carousel
            opts={{
              loop: true,
              align: 'start',
            }}
            className="w-full"
            setApi={(api) => {
              setCarouselApi(api);
              if (api) {
                api.on('select', () => {
                  if (api) {
                    const selectedIndex = api.selectedScrollSnap();
                    setActiveIndex(selectedIndex);
                  }
                });
              }
            }}
          >
            <CarouselContent>
              {transformedGames.map((game) => (
                <CarouselItem key={game.id}>
                  <Link href={`/detail/${game.slug}`} className="block">
                    <div className="game-card relative aspect-[16/9]">
                      <div className="absolute top-0 right-0 z-10 p-6">
                        <Bookmark
                          size={24}
                          className="cursor-pointer text-white hover:text-yellow-400"
                          fill="rgba(0,0,0,0.5)"
                        />
                      </div>
                      {game.images && game.images.banner ? (
                        <Image
                          src={game.images.banner}
                          alt={`Banner image for ${game.name}`}
                          width={1920}
                          height={1080}
                          className="h-full w-full object-cover"
                          priority={true}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                          <Gamepad2 size={60} className="text-zinc-500" />
                        </div>
                      )}
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Mobile pagination dots */}
          <PaginationDots
            totalItems={transformedGames.length}
            activeIndex={activeIndex}
            carouselApi={carouselApi}
            className="lg:hidden"
          />
        </div>

        {/* Right Sidebar - Takes 1/4 of the width on large screens */}
        <div className="hidden h-full rounded-lg bg-zinc-800 p-4 lg:block">
          <div className="grid h-full grid-rows-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
            {transformedGames.map((game, index) => (
              <div
                key={`thumb-${game.id}`}
                ref={(el) => {
                  thumbnailRefs.current[index] = el;
                }}
                className={`flex cursor-pointer items-center gap-3 rounded-md p-2 transition-all ${activeIndex === index ? 'bg-zinc-700' : 'hover:bg-zinc-700/50'}`}
                onClick={() => {
                  setActiveIndex(index);
                  carouselApi?.scrollTo(index);
                }}
              >
                <div className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-md transition-all duration-200 ${activeIndex === index ? 'scale-110' : ''
                  }`}>
                  {game.images.thumbnail ? (
                    <Image
                      src={game.images.thumbnail}
                      alt={`Thumbnail image for ${game.name}`}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-700">
                      <Gamepad2 size={20} className="text-zinc-500" />
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-col gap-1">
                  <h4 className="hidden text-sm font-medium break-words xl:block">
                    {game.name}
                  </h4>
                  <p className="truncate text-xs text-zinc-400">
                    {game.developer}
                  </p>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star size={12} fill="currentColor" />
                    <p className="text-xs font-bold">{'0.0'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroGames;
