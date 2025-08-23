'use client';

import Image from 'next/image';
import type { GameDbData } from '@/types';
import { Star, Ghost, Gamepad2, Loader2 } from 'lucide-react';
import { getAvatarBorderColor } from '@/utils/steam-utils';
import SteamReviewBadge from '@/components/shared/steam-review-badge';
import CatalogRating from '@/components/shared/catelog-rating/catalog-rating';
import { useGameRating } from '@/hooks/useGameRating';
import { useSteamReviews } from '@/hooks/useSteamReviews';

import DynamicTrendChart from './dynamic-trend-chart';

export default function HighlightGameCard({ game }: { game: GameDbData }) {
  const {
    rating,
    overallAverage,
    isLoading: isLoadingRating,
  } = useGameRating(game.id);

  // Fetch real-time Steam reviews (client-side only)
  const { steamReviews } = useSteamReviews(game.name);

  const avatarBorderColorClass = getAvatarBorderColor(
    steamReviews?.steam_all_review ?? undefined,
  );

  return (
    <div className="highlight-card">
      {/* Top Row */}
      <div className="mb-3 flex items-center">
        <div
          className={`mr-3 flex-shrink-0 rounded-full border-2 p-0.5 ${avatarBorderColorClass}`}
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-full">
            <Image
              src={game.cover_url ?? ''}
              alt={`${game.name} avatar`}
              fill
              sizes="40px"
              className="rounded-full object-cover"
            />
          </div>
        </div>
        <div className="min-w-0 flex-grow">
          <h2 className="truncate text-lg font-semibold" title={game.name}>
            {game.name}
          </h2>
        </div>
        <div className="ml-2 flex flex-shrink-0 items-center text-yellow-400">
          <Star size={18} className="mr-1 fill-current" />
          <span className="text-md font-bold">
            {isLoadingRating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (overallAverage || 0) > 0 ? (
              overallAverage || 0
            ) : (
              'N/A'
            )}
          </span>
        </div>
      </div>

      {/* Subtext Row */}
      <div className="mb-3 flex items-center space-x-2 truncate text-xs text-neutral-400">
        <div className="flex min-w-0 items-center">
          <Ghost size={12} className="mr-1 flex-shrink-0" />
          <span className="truncate" title={game.developers?.[0] ?? ''}>
            {game.developers?.[0]}
          </span>
        </div>
        <span className="text-neutral-500">•</span>
        <div className="flex min-w-0 items-center">
          <Gamepad2 size={12} className="mr-1 flex-shrink-0" />
          <span className="truncate">
            {(() => {
              // Prioritize Steam tags over IGDB genres
              const tags = game.steam_popular_tags || game.genres;
              if (!tags || tags.length === 0) return '';

              const displayTags = tags.slice(0, 3);

              return displayTags.join(', ');
            })()}
          </span>
        </div>
      </div>

      {/* Media: Banner Image */}
      {game.banner_url && (
        <div className="mb-3 aspect-[16/9] overflow-hidden rounded-md bg-neutral-800">
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
      <div className="mb-4">
        <DynamicTrendChart keyword={game.name} hideYAxis hideXAxis />
      </div>

      {/* Catalog Rating Section */}
      <div className="highlight-card-section mb-4">
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

      {/* Footer Row */}
      <div className="highlight-card-footer">
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
