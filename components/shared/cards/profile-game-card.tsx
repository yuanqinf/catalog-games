'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { GameDbData } from '@/types';
import {
  Star,
  Gamepad2,
  Loader2,
  ThumbsDown,
  Hammer,
  CircleX,
  SmilePlus,
} from 'lucide-react';
import CatalogRating from '@/components/shared/catelog-rating/catalog-rating';
import { useGameRating } from '@/hooks/useGameRating';
import NumberFlow from '@number-flow/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ProfileGameCardProps {
  game: GameDbData;
  userGameDislikeCount: number;
  userGameEmojiCount?: number;
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
  userGameDislikeCount,
  userGameEmojiCount,
}: ProfileGameCardProps) {
  const {
    rating,
    overallAverage,
    isLoading: isLoadingRating,
  } = useGameRating(game.id);

  // Fetch ranking data for avatar border color
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

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

  const handleUndoDislike = async () => {
    if (!game.id) return;

    setIsRemoving(true);
    try {
      // Remove both dislikes and emoji reactions in parallel
      const [dislikeResponse, emojiResponse] = await Promise.all([
        fetch(`/api/games/dislike?gameId=${game.id}`, {
          method: 'DELETE',
        }),
        fetch(`/api/games/emoji-reaction?gameId=${game.id}`, {
          method: 'DELETE',
        }),
      ]);

      const dislikeResult = await dislikeResponse.json();
      const emojiResult = await emojiResponse.json();

      // Check if both operations succeeded
      const dislikeSuccess = dislikeResult.success;
      const emojiSuccess = emojiResult.success;

      if (dislikeSuccess && emojiSuccess) {
        toast.success(
          `Successfully removed all dislikes and emoji reactions for ${game.name}`,
        );
        setIsDialogOpen(false);
        // Refresh the page to update the UI
        window.location.reload();
      } else if (dislikeSuccess && !emojiSuccess) {
        toast.success(
          `Removed dislikes for ${game.name}. ${emojiResult.error || 'No emoji reactions to remove'}`,
        );
        setIsDialogOpen(false);
        window.location.reload();
      } else if (!dislikeSuccess && emojiSuccess) {
        toast.success(
          `Removed emoji reactions for ${game.name}. ${dislikeResult.error || 'No dislikes to remove'}`,
        );
        setIsDialogOpen(false);
        window.location.reload();
      } else {
        toast.error('Failed to remove dislikes and emoji reactions');
      }
    } catch (error) {
      console.error('Error removing dislikes and emoji reactions:', error);
      toast.error('An error occurred while removing data');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="highlight-card transition-transform duration-200 hover:scale-[1.02]">
      <Link href={`/detail/${game.slug}`} className="cursor-pointer">
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
          <div className="ml-2 flex flex-shrink-0 items-center gap-3">
            {userGameDislikeCount !== undefined ? (
              <div className="flex items-center text-red-500">
                <ThumbsDown size={18} className="mr-1 fill-current" />
                <span className="text-md font-bold">
                  <NumberFlow value={userGameDislikeCount} />
                </span>
              </div>
            ) : (
              <div className="flex items-center text-yellow-400">
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
            {userGameEmojiCount !== undefined && userGameEmojiCount > 0 && (
              <div className="flex items-center text-yellow-400">
                <SmilePlus size={18} className="mr-1" />
                <span className="text-md font-bold">
                  <NumberFlow value={userGameEmojiCount} />
                </span>
              </div>
            )}
          </div>
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
      </Link>

      {/* Footer Row */}
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
          <span className="mr-2 hidden sm:inline-block">
            Catalog Dislike Rating:{' '}
          </span>
          <span className="font-semibold text-neutral-200">
            {overallAverage ? overallAverage : 'N/A'}
          </span>
        </div>

        {/* Undo Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-red-500 font-bold text-white transition-all hover:scale-105 hover:bg-red-600 hover:shadow-lg"
            >
              <CircleX className="h-4 w-4" />
              Remove
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove All Interactions</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove all your dislikes and emoji
                reactions for{' '}
                <span className="font-semibold text-white">{game.name}</span>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isRemoving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUndoDislike}
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  'Remove All'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
