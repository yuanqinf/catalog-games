'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { GameDbData } from '@/types';
import { Star, Gamepad2, Loader2, ThumbsDown, Hammer } from 'lucide-react';
import CatalogRating from '@/components/shared/catelog-rating/catalog-rating';
import { useGameRating } from '@/hooks/useGameRating';
import NumberFlow from '@number-flow/react';

interface ProfileGameCardProps {
  game: GameDbData;
  userDislikeCount: number;
}

interface RankingData {
  currentGame: {
    id: number;
    name: string;
    slug: string;
    dislike_count: number;
    rank: number | null;
  };
}

export default function ProfileGameCard({
  game,
  userDislikeCount,
}: ProfileGameCardProps) {
  const {
    rating,
    overallAverage,
    isLoading: isLoadingRating,
  } = useGameRating(game.id);

  // Fetch ranking data for avatar border color
  const [rankingData, setRankingData] = useState<RankingData | null>(null);

  useEffect(() => {
    async function fetchRankingData() {
      try {
        const response = await fetch(`/api/games/${game.id}/ranking`);
        if (response.ok) {
          const data = await response.json();
          setRankingData(data);
        }
      } catch (error) {
        console.error('Failed to fetch ranking data:', error);
      }
    }

    if (game.id) {
      fetchRankingData();
    }
  }, [game.id]);

  const getRankingColor = (rank: number | null) => {
    if (!rank) return 'yellow';
    if (rank <= 5) return 'red';
    if (rank <= 15) return 'orange';
    return 'yellow';
  };

  const avatarBorderColorClass = `border-${getRankingColor(rankingData?.currentGame.rank ?? null)}-600`;

  return (
    <Link href={`/detail/${game.slug}`}>
      <div className="highlight-card cursor-pointer transition-transform duration-200 hover:scale-[1.02]">
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
          {userDislikeCount !== undefined ? (
            <div className="ml-2 flex flex-shrink-0 items-center text-red-500">
              <ThumbsDown size={18} className="mr-1 fill-current" />
              <span className="text-md font-bold">
                <NumberFlow value={userDislikeCount} />
              </span>
            </div>
          ) : (
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
          )}
        </div>

        {/* Subtext Row */}
        <div className="mb-3 flex items-center space-x-2 truncate text-xs text-neutral-400">
          <div className="flex min-w-0 items-center">
            <Hammer size={12} className="mr-1 flex-shrink-0" />
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
          <div className="mb-4 aspect-[16/9] overflow-hidden rounded-md bg-neutral-800">
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
          {/* Total Dislikes */}
          <div
            title={`Total Dislikes: ${game.dislike_count || 0}`}
            className="flex items-center"
          >
            <span className="mr-1 hidden sm:inline-block">
              Total Dislikes:{' '}
            </span>
            <span className="font-semibold text-neutral-200">
              <NumberFlow value={game.dislike_count || 0} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
