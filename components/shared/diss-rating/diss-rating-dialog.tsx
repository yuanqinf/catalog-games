'use client';

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { RATING_BLOCK_COLORS, EMPTY_BLOCK_COLOR } from '@/constants/colors';
import { ratingCategories } from '@/constants/rating-categories';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { DissRatingSkeleton } from './diss-rating-skeleton';
import { useGameRating } from '@/hooks/useGameRating';
import { dark } from '@clerk/themes';
import { useTranslation } from '@/lib/i18n/client';

const RatingBlock = styled.div<{
  $fillColor: string;
  $bgColor: string;
  $fillPercent: number;
}>`
  background: ${(props) =>
    props.$fillPercent === 100
      ? props.$fillColor
      : props.$fillPercent === 0
        ? props.$bgColor
        : `linear-gradient(to right, ${props.$fillColor} ${props.$fillPercent}%, ${props.$bgColor} ${props.$fillPercent}%)`};
  height: 1.25rem;
  flex: 1;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

interface GameRating {
  story: number;
  music: number;
  graphics: number;
  gameplay: number;
  longevity: number;
}

interface DissRatingDialogProps {
  className?: string;
  gameId?: string;
  maxRating?: number;
  trigger?: React.ReactNode;
  onSaveSuccess?: () => void;
}

const defaultRating: GameRating = {
  story: 0,
  music: 0,
  graphics: 0,
  gameplay: 0,
  longevity: 0,
};

const getBlockFillStyle = (blockIndex: number, categoryRating: number) => {
  const fullValue = Math.floor(categoryRating);
  const fractionalPart = categoryRating - fullValue;
  const fillColor = RATING_BLOCK_COLORS[blockIndex] || EMPTY_BLOCK_COLOR;
  const bgColor = EMPTY_BLOCK_COLOR;

  let fillPercent = 0;
  if (blockIndex < fullValue) {
    fillPercent = 100;
  } else if (blockIndex === fullValue) {
    fillPercent = Math.round(fractionalPart * 100);
  }

  return { fillColor, bgColor, fillPercent };
};

const DissRatingDialog: React.FC<DissRatingDialogProps> = ({
  maxRating = 5,
  trigger,
  gameId,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [currentRating, setCurrentRating] = useState<GameRating>(defaultRating);
  const [hoverRating, setHoverRating] = useState<GameRating>(defaultRating);
  const [isSaving, setIsSaving] = useState(false);
  const [clickingCategory, setClickingCategory] = useState<
    keyof GameRating | null
  >(null);

  // Use SWR hook for user rating data
  const {
    rating: userRating,
    isLoading,
    mutate,
  } = useGameRating(gameId, user?.id);

  const handleRatingChange = (category: keyof GameRating, value: number) => {
    // Play pop sound effect
    const audio = new Audio('/sounds/pop_sound.wav');
    audio.volume = 0.2;
    audio.play();

    // Trigger button animation for this specific category
    setClickingCategory(category);
    setTimeout(() => setClickingCategory(null), 200);

    setCurrentRating((prev) => ({
      ...prev,
      [category]: value,
    }));
    setHoverRating((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  // Update current rating when user rating is loaded
  useEffect(() => {
    if (isOpen) {
      setCurrentRating(userRating);
      setHoverRating(userRating);
    }
  }, [userRating, isOpen]);

  const handleSave = async () => {
    if (!user || !gameId) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/games/rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: parseInt(gameId),
          rating: currentRating,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save rating');
      }

      // Force revalidate the SWR cache to fetch fresh data
      await mutate();

      // Notify parent component to refresh if callback provided
      if (onSaveSuccess) {
        onSaveSuccess();
      }

      toast.success(t('diss_rating_saved_success'));
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save rating:', error);
      toast.error(t('diss_rating_save_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrentRating(defaultRating);
    setHoverRating(defaultRating);
    setIsOpen(false);
  };

  const handleMouseEnter = (category: keyof GameRating, value: number) => {
    setHoverRating((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleMouseLeave = (category: keyof GameRating) => {
    setHoverRating((prev) => ({
      ...prev,
      [category]: currentRating[category],
    }));
  };

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="icon"
      className="size-auto bg-neutral-800 p-1 text-gray-400 opacity-70 transition-colors duration-200 hover:bg-neutral-700 hover:text-white hover:opacity-100"
      title="Edit ratings"
    >
      <MessageSquarePlus size={16} />
    </Button>
  );

  const renderRatingContent = () => (
    <>
      <div className="space-y-4 py-4">
        {ratingCategories.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white capitalize">
                {label}
              </span>
              <span className="text-sm text-gray-500">
                {hoverRating[key as keyof GameRating]}/{maxRating}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {[...Array(maxRating)].map((_, i) => {
                const ratingValue = i + 1;
                const { fillColor, bgColor, fillPercent } = getBlockFillStyle(
                  i,
                  hoverRating[key as keyof GameRating],
                );

                return (
                  <RatingBlock
                    key={i}
                    $fillColor={fillColor}
                    $bgColor={bgColor}
                    $fillPercent={fillPercent}
                    onClick={() =>
                      handleRatingChange(key as keyof GameRating, ratingValue)
                    }
                    onMouseEnter={() =>
                      handleMouseEnter(key as keyof GameRating, ratingValue)
                    }
                    onMouseLeave={() =>
                      handleMouseLeave(key as keyof GameRating)
                    }
                    title={`${label}: ${ratingValue}/${maxRating}`}
                  />
                );
              })}
              <motion.div
                animate={
                  clickingCategory === key ? { scale: [1, 0.8, 1.1, 1] } : {}
                }
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={() => {
                    const currentValue = currentRating[key as keyof GameRating];
                    const nextValue =
                      currentValue >= maxRating ? 0 : currentValue + 1;
                    handleRatingChange(key as keyof GameRating, nextValue);
                  }}
                  className="h-6 w-6 bg-red-600 p-0 text-white hover:bg-red-700"
                  size="sm"
                  title={`Click to increment rating (${currentRating[key as keyof GameRating]}/${maxRating})`}
                >
                  <ThumbsDown size={14} />
                </Button>
              </motion.div>
            </div>
          </div>
        ))}
      </div>

      <DialogFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setCurrentRating(defaultRating);
            setHoverRating(defaultRating);
          }}
          className="text-xs"
          disabled={isSaving}
        >
          {t('diss_rating_reset_all')}
        </Button>
        <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
          {t('diss_rating_cancel')}
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t('diss_rating_saving') : t('diss_rating_save')}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('diss_rating_dialog_title')}</DialogTitle>
          <DialogDescription>
            {t('diss_rating_dialog_description')}
          </DialogDescription>
        </DialogHeader>

        <SignedIn>
          {isLoading ? (
            <DissRatingSkeleton maxRating={maxRating} />
          ) : (
            renderRatingContent()
          )}
        </SignedIn>

        <SignedOut>
          <div className="space-y-4 py-6 text-center">
            <h3 className="text-base font-medium text-white">
              {t('diss_rating_sign_in_to_rate')}
            </h3>
            <SignInButton mode="modal" appearance={{ baseTheme: dark }}>
              <Button
                onClick={() => {
                  setIsOpen(false);
                }}
              >
                {t('auth_login')}
              </Button>
            </SignInButton>
          </div>
        </SignedOut>
      </DialogContent>
    </Dialog>
  );
};

export default DissRatingDialog;
