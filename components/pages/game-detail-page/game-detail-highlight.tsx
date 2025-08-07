'use client';

import Image from 'next/image';
import DynamicTrendChart from '@/components/shared/cards/dynamic-trend-chart';
import CatalogRating from '@/components/shared/catelog-rating/catalog-rating';
import SteamReviewBadge from '@/components/shared/steam-review-badge';

import { useGameRatingCache } from '@/hooks/useGameRatingCache';
import { GameDbData } from '@/types';

interface GameDetailHighlightProps {
  game: GameDbData;
}

export default function GameDetailHighlight({
  game,
}: GameDetailHighlightProps) {
  const { rating, isLoading: isLoadingRating } = useGameRatingCache(game.id);

  return (
    <div className="space-y-6 lg:sticky lg:top-4 lg:col-span-1 lg:self-start">
      {game.banner_url && (
        <div className="aspect-[16/9] overflow-hidden rounded-md bg-neutral-800">
          <div className="relative h-full w-full">
            <Image
              src={game.banner_url}
              alt={`${game.name} banner`}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
          </div>
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
