'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
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
import { GameService } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { RatingSkeleton } from './rating-skeleton';
import { useGameRating } from '@/hooks/useGameRating';

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

interface CatalogRatingDialogProps {
  className?: string;
  gameId?: string;
  maxRating?: number;
  trigger?: React.ReactNode;
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

const CatalogRatingDialog: React.FC<CatalogRatingDialogProps> = ({
  maxRating = 5,
  trigger,
  gameId,
}) => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [currentRating, setCurrentRating] = useState<GameRating>(defaultRating);
  const [hoverRating, setHoverRating] = useState<GameRating>(defaultRating);
  const [isSaving, setIsSaving] = useState(false);

  // Use SWR hook for user rating data
  const {
    rating: userRating,
    isLoading,
    mutate,
  } = useGameRating(gameId, user?.id);

  const handleRatingChange = (category: keyof GameRating, value: number) => {
    setCurrentRating((prev) => ({
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
      const gameService = new GameService();
      await gameService.saveUserRating(
        parseInt(gameId),
        user.id,
        currentRating,
      );
      // Revalidate the SWR cache
      mutate();
      toast.success('Rating saved successfully!');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save rating:', error);
      toast.error('Failed to save rating. Please try again.');
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
      className="size-auto bg-neutral-800 p-1 text-neutral-400 opacity-70 transition-colors duration-200 hover:bg-neutral-700 hover:text-white hover:opacity-100"
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
              <span className="text-sm font-medium text-neutral-700 capitalize">
                {label}
              </span>
              <span className="text-sm text-neutral-500">
                {hoverRating[key as keyof GameRating]}/{maxRating}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const currentValue = currentRating[key as keyof GameRating];
                  handleRatingChange(
                    key as keyof GameRating,
                    currentValue === 0 ? 1 : 0,
                  );
                }}
                onMouseEnter={() =>
                  handleMouseEnter(key as keyof GameRating, 0)
                }
                onMouseLeave={() => handleMouseLeave(key as keyof GameRating)}
                className={`h-6 w-6 p-0 transition-colors ${
                  currentRating[key as keyof GameRating] === 0
                    ? 'bg-red-100 text-red-500 hover:text-red-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                title={`${currentRating[key as keyof GameRating] === 0 ? 'Unselect' : 'Reset'} ${label} to 0`}
              >
                <ThumbsDown size={14} />
              </Button>
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
          Reset All
        </Button>
        <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Ratings'}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>My ratings for this game</DialogTitle>
          <DialogDescription>
            Rate this game to help others find the best games.
          </DialogDescription>
        </DialogHeader>

        <SignedIn>
          {isLoading ? (
            <RatingSkeleton maxRating={maxRating} />
          ) : (
            renderRatingContent()
          )}
        </SignedIn>

        <SignedOut>
          <div className="space-y-4 py-6 text-center">
            <h3 className="text-base font-medium text-white">
              Sign in to rate this game
            </h3>
            <SignInButton>
              <Button>Sign In</Button>
            </SignInButton>
          </div>
        </SignedOut>
      </DialogContent>
    </Dialog>
  );
};

export default CatalogRatingDialog;
