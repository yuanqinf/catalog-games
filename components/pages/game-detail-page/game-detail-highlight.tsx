'use client';

import Image from 'next/image';
import DynamicTrendChart from '@/components/shared/cards/dynamic-trend-chart';
import CatalogRating from '@/components/shared/catelog-rating/catalog-rating';
import SteamReviewBadge from '@/components/shared/steam-review-badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

import { useGameRating } from '@/hooks/useGameRating';
import { GameDbData } from '@/types';

interface GameDetailHighlightProps {
  game: GameDbData;
}

export default function GameDetailHighlight({
  game,
}: GameDetailHighlightProps) {
  const {
    rating,
    overallAverage,
    isLoading: isLoadingRating,
  } = useGameRating(game.id);

  // Build image carousel: banner first, then screenshots
  const carouselImages = [
    ...(game.banner_url
      ? [{ url: game.banner_url, alt: `${game.name} banner` }]
      : []),
    ...(game.screenshots?.map((screenshot, index) => ({
      url: screenshot,
      alt: `${game.name} screenshot ${index + 1}`,
    })) || []),
  ];

  return (
    <div className="space-y-6 lg:sticky lg:top-8 lg:col-span-1 lg:self-start">
      {carouselImages.length > 0 && (
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              {carouselImages.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-[16/9] overflow-hidden rounded-md bg-neutral-800">
                    <div className="relative h-full w-full">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 800px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {carouselImages.length > 1 && (
              <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </>
            )}
          </Carousel>
        </div>
      )}

      <div>
        <DynamicTrendChart keyword={game.name} hideYAxis hideXAxis />
      </div>

      <div className="highlight-card-section">
        <CatalogRating
          rating={rating}
          gameId={game.id?.toString()}
          isLoading={isLoadingRating}
        />
      </div>

      <div className="highlight-card-footer">
        {/* Steam Review */}
        <SteamReviewBadge review={game.steam_all_review ?? undefined} />

        {/* Catalog User Rating */}
        <div
          title={`Catalog User Rating: ${overallAverage}`}
          className="flex items-center"
        >
          <Image
            src="/images/logo.png"
            alt="Catalog Logo"
            width={24}
            height={24}
            className="mr-1"
          />
          <span className="mr-2 hidden sm:inline-block">Catalog Rating: </span>
          <span className="font-semibold text-neutral-200">
            {overallAverage ? overallAverage : 'N/A'}
          </span>
        </div>

        {/* IGDB Score */}
        <div title={`IGDB User Rating: ${game.igdb_user_rating}`}>
          <span className="mr-1 hidden sm:inline-block">
            IGDB User Rating:{' '}
          </span>
          <span className="font-semibold text-neutral-200">
            {game.igdb_user_rating ? game.igdb_user_rating : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
