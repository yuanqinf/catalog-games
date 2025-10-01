'use client';

import Image from 'next/image';
import DynamicTrendChart from '@/components/shared/cards/dynamic-trend-chart';
import CatalogRating from '@/components/shared/catelog-rating/catalog-rating';
import SteamReviewBadge from '@/components/shared/steam-review-badge';

import { useGameRating } from '@/hooks/useGameRating';
import { useSteamReviews } from '@/hooks/useSteamReviews';
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

  // Fetch real-time Steam reviews (client-side only)
  const { steamReviews } = useSteamReviews(game.name);

  return (
    <div className="space-y-6 lg:col-span-1">
      <div>
        <DynamicTrendChart keyword={game.name} hideYAxis hideXAxis />
      </div>

      <div className="highlight-card-section">
        <CatalogRating
          rating={rating}
          gameId={game.id?.toString()}
          isLoading={isLoadingRating}
          isUpcoming={
            game.first_release_date
              ? new Date(game.first_release_date) > new Date()
              : false
          }
        />
      </div>

      <div className="highlight-card-footer">
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

        {/* Steam Review - client-side real-time data only with slide-in animation */}
        <div
          className={`transition-all duration-500 ease-out ${
            steamReviews?.steam_all_review
              ? 'translate-x-0 opacity-100'
              : 'translate-x-4 opacity-0'
          }`}
        >
          <SteamReviewBadge
            review={steamReviews?.steam_all_review ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
