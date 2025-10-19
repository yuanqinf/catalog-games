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
import DissRating from '@/components/shared/diss-rating/diss-rating';
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
import { RATING_BLOCK_COLORS } from '@/constants/colors';
import { useTranslation } from '@/lib/i18n/client';

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
  const { t } = useTranslation();
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
      // Remove dislikes, emoji reactions, and ratings in parallel
      const [dislikeResponse, emojiResponse, ratingResponse] =
        await Promise.all([
          fetch(`/api/games/dislike?gameId=${game.id}`, {
            method: 'DELETE',
          }),
          fetch(`/api/games/emoji-reaction?gameId=${game.id}`, {
            method: 'DELETE',
          }),
          fetch(`/api/games/rating?gameId=${game.id}`, {
            method: 'DELETE',
          }),
        ]);

      const dislikeResult = await dislikeResponse.json();
      const emojiResult = await emojiResponse.json();
      const ratingResult = await ratingResponse.json();

      // Check which operations succeeded
      const dislikeSuccess = dislikeResult.success;
      const emojiSuccess = emojiResult.success;
      const ratingSuccess = ratingResult.success;

      // Count successful operations
      const successCount = [dislikeSuccess, emojiSuccess, ratingSuccess].filter(
        Boolean,
      ).length;

      if (successCount === 3) {
        toast.success(`${t('profile_card_removed_all_success')} ${game.name}`);
        setIsDialogOpen(false);
        window.location.reload();
      } else if (successCount > 0) {
        const successMessages = [];
        if (dislikeSuccess) successMessages.push(t('profile_card_dislikes'));
        if (emojiSuccess)
          successMessages.push(t('profile_card_emoji_reactions'));
        if (ratingSuccess) successMessages.push(t('profile_card_ratings'));

        toast.success(
          `${t('profile_card_removed_partial_success').replace('{items}', successMessages.join(', ')).replace('{game}', game.name)}`,
        );
        setIsDialogOpen(false);
        window.location.reload();
      } else {
        toast.error(t('profile_card_no_interactions'));
      }
    } catch (error) {
      console.error('Error removing interactions:', error);
      toast.error(t('profile_card_error_removing'));
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
                <span className="text-base font-bold">
                  <NumberFlow value={userGameDislikeCount} />
                </span>
              </div>
            ) : (
              <div className="flex items-center text-yellow-400">
                <Star size={18} className="mr-1 fill-current" />
                <span className="text-base font-bold">
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
                <span className="text-base font-bold">
                  <NumberFlow value={userGameEmojiCount} />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Subtext Row */}
        <div className="mb-3 flex items-center space-x-2 truncate text-xs text-gray-400">
          <div className="flex min-w-0 items-center">
            <Hammer size={12} className="mr-1 flex-shrink-0" />
            <span className="truncate" title={game.developers?.[0] ?? ''}>
              {game.developers?.[0]}
            </span>
          </div>
          <span className="text-gray-500">•</span>
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

        {/* Diss Rating Section */}
        <div className="highlight-card-section mb-4">
          <DissRating
            rating={rating}
            gameId={game.id?.toString()}
            isLoading={isLoadingRating}
            isProfile
          />
        </div>
      </Link>

      {/* Footer Row */}
      <div className="highlight-card-footer">
        {/* Diss Rating */}
        <div
          title={`Overall Diss Rating: ${overallAverage}`}
          className="flex items-center"
        >
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={24}
            height={24}
            className="mr-1"
          />
          <span className="hidden sm:inline-block">
            {t('profile_card_diss_avg_rating')}{' '}
            <span
              className="font-bold"
              style={{
                color: overallAverage
                  ? RATING_BLOCK_COLORS[Math.floor(overallAverage) - 1]
                  : '#9CA3AF',
              }}
            >
              {overallAverage ? overallAverage : 'N/A'}
            </span>
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
              {t('profile_card_remove_button')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('profile_card_remove_dialog_title')}</DialogTitle>
              <DialogDescription>
                {t('profile_card_remove_dialog_description')}{' '}
                <span className="font-semibold text-white">{game.name}</span>?{' '}
                {t('profile_card_remove_dialog_warning')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isRemoving}
              >
                {t('profile_card_cancel_button')}
              </Button>
              <Button
                onClick={handleUndoDislike}
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('profile_card_removing')}
                  </>
                ) : (
                  t('profile_card_remove_all_button')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
