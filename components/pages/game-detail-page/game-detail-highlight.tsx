'use client';

import Image from 'next/image';
import DynamicTrendChart from '@/components/shared/cards/dynamic-trend-chart';
import CatalogRating from '@/components/shared/catelog-rating/catalog-rating';
import { useGameRatingCache } from '@/hooks/useGameRatingCache';
import { GameDbData } from '@/types';
import { getSteamReviewPresentation } from '@/utils/game-utils';

interface GameDetailHighlightProps {
  game: GameDbData;
}

export default function GameDetailHighlight({
  game,
}: GameDetailHighlightProps) {
  const { rating, isLoading: isLoadingRating } = useGameRatingCache(game.id);

  const steamPresentation = getSteamReviewPresentation(
    game.steam_all_review ?? undefined,
  );

  return (
    <div className="space-y-6 lg:col-span-1">
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
        {steamPresentation && (
          <div
            className="flex items-center"
            title={`Steam: ${steamPresentation.label}`}
          >
            <steamPresentation.IconComponent
              className={`mr-1.5 h-4 w-4 flex-shrink-0 ${steamPresentation.colorClass}`}
            />
            <span
              className={`hidden truncate font-semibold xl:inline-block ${steamPresentation.colorClass} capitalize`}
            >
              {steamPresentation.label}
            </span>
          </div>
        )}

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
