'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { RATING_BLOCK_COLORS, EMPTY_BLOCK_COLOR } from '@/constants/colors';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, ThumbsDown, LogIn } from 'lucide-react';

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
  rating?: Partial<GameRating>;
  maxRating?: number;
  onSave?: (rating: GameRating) => void;
  trigger?: React.ReactNode;
  className?: string;
  gameId?: string;
}

const defaultRating: GameRating = {
  story: 0,
  music: 0,
  graphics: 0,
  gameplay: 0,
  longevity: 0,
};

const ratingCategories = [
  { key: 'story', label: 'Story' },
  { key: 'music', label: 'Music' },
  { key: 'graphics', label: 'Graphics' },
  { key: 'gameplay', label: 'Gameplay' },
  { key: 'longevity', label: 'Longevity' },
] as const;

const CatalogRatingDialog: React.FC<CatalogRatingDialogProps> = ({
  rating = defaultRating,
  maxRating = 5,
  onSave,
  trigger,
  className = '',
  gameId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRating, setCurrentRating] = useState<GameRating>(defaultRating);
  const [hoverRating, setHoverRating] = useState<GameRating>(defaultRating);

  const handleRatingChange = (category: keyof GameRating, value: number) => {
    setCurrentRating((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleSave = () => {
    onSave?.(currentRating);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setCurrentRating(defaultRating);
    setHoverRating(defaultRating);
    setIsOpen(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>My ratings for this game</DialogTitle>
        </DialogHeader>

        <SignedIn>
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
                      const currentValue =
                        currentRating[key as keyof GameRating];
                      handleRatingChange(
                        key as keyof GameRating,
                        currentValue === 0 ? 1 : 0,
                      );
                    }}
                    onMouseEnter={() =>
                      handleMouseEnter(key as keyof GameRating, 0)
                    }
                    onMouseLeave={() =>
                      handleMouseLeave(key as keyof GameRating)
                    }
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
                    const { fillColor, bgColor, fillPercent } =
                      getBlockFillStyle(
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
                          handleRatingChange(
                            key as keyof GameRating,
                            ratingValue,
                          )
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

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentRating(defaultRating);
                setHoverRating(defaultRating);
              }}
              className="text-xs"
            >
              Reset All
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Ratings</Button>
            </div>
          </DialogFooter>
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
