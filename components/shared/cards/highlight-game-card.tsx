import Image from 'next/image';
import type { GameDbData } from '@/types';
import { Star, Ghost, Gamepad2, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import {
  TAILWIND_TEXT_COLORS,
  TAILWIND_BORDER_COLORS,
} from '@/constants/colors';
import DynamicTrendChart from './dynamic-trend-chart';
import CatalogRating from '@/components/shared/catelog-rating/catalog-rating';

const mockRating = {
  story: 2,
  music: 2.5,
  graphics: 4,
  gameplay: 3.9,
  longevity: 4.8,
};

type SteamReviewPresentation = {
  IconComponent: React.ElementType;
  colorClass: string;
  label: string;
};

export default function HighlightGameCard({ game }: { game: GameDbData }) {
  const getSteamReviewPresentation = (
    review?: string,
  ): SteamReviewPresentation | null => {
    if (!review?.trim()) return null;

    const lowerReview = review.toLowerCase();
    let IconComponent: React.ElementType = ThumbsUp;
    let colorClass: string = TAILWIND_TEXT_COLORS.neutral;

    if (lowerReview.includes('positive')) {
      colorClass = TAILWIND_TEXT_COLORS.positive;
    } else if (lowerReview.includes('negative')) {
      colorClass = TAILWIND_TEXT_COLORS.negative;
      IconComponent = ThumbsDown;
    } else if (lowerReview.includes('mixed')) {
      colorClass = TAILWIND_TEXT_COLORS.mixed;
      IconComponent = Meh;
    }
    return { IconComponent, colorClass, label: review };
  };

  const steamPresentation = getSteamReviewPresentation(
    game.steam_all_review ?? undefined,
  );
  let avatarBorderColorClass: string = TAILWIND_BORDER_COLORS.neutral; // Default border
  if (steamPresentation && steamPresentation.colorClass) {
    avatarBorderColorClass = steamPresentation.colorClass.replace(
      'text-',
      'border-',
    );
  }

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
            {/* TODO: Add rating */}
            {'N/A'}
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
        <CatalogRating rating={mockRating} gameId={game.id?.toString()} />
      </div>

      {/* Footer Row */}
      <div className="highlight-card-footer">
        {/* TODO: Google Trend Score*/}
        {/* <div className="truncate">
          <p className="truncate font-medium text-neutral-300">
            {"Google Trend: 123"}
          </p>
        </div> */}

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
