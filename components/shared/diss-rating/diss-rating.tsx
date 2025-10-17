import React from 'react';
import styled from 'styled-components';
import { SquarePen } from 'lucide-react';
import { RATING_BLOCK_COLORS, EMPTY_BLOCK_COLOR } from '@/constants/colors';
import { ratingCategories } from '@/constants/rating-categories';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import DissRatingDialog from './diss-rating-dialog';

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
  height: 0.75rem;
  flex: 1;
  border-radius: 0.125rem;
`;

interface GameRating {
  story: number;
  music: number;
  graphics: number;
  gameplay: number;
  longevity: number;
}

interface DissRatingProps {
  rating?: Partial<GameRating>;
  maxRating?: number;
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showEditButton?: boolean;
  gameId?: string;
  isLoading?: boolean;
  onSaveSuccess?: () => void;
  isProfile?: boolean;
}

const defaultRating: GameRating = {
  story: 0,
  music: 0,
  graphics: 0,
  gameplay: 0,
  longevity: 0,
};

const sizeConfig = {
  sm: {
    container: 'space-y-1 text-xs',
    labelWidth: 'w-16',
    blockHeight: 'h-2',
    gap: 'gap-1',
  },
  md: {
    container: 'space-y-2 text-sm',
    labelWidth: 'w-20',
    blockHeight: 'h-3',
    gap: 'gap-1.5',
  },
  lg: {
    container: 'space-y-3 text-base',
    labelWidth: 'w-24',
    blockHeight: 'h-4',
    gap: 'gap-2',
  },
} as const;

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

const DissRating: React.FC<DissRatingProps> = ({
  rating = defaultRating,
  maxRating = 5,
  className = '',
  showLabels = true,
  size = 'md',
  gameId,
  isLoading = false,
  onSaveSuccess,
  isProfile = false,
}) => {
  const config = sizeConfig[size];
  const mergedRating = { ...defaultRating, ...rating };

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className={`${config.container} ${className} relative`}>
        <div className="space-y-2">
          {ratingCategories.map(({ key, label }) => (
            <div key={key} className="flex items-center">
              <span className="w-20 flex-shrink-0 text-sm text-gray-400 capitalize">
                {label}
              </span>
              <div className="flex flex-grow gap-1.5">
                {[...Array(maxRating)].map((_, i) => (
                  <Skeleton key={i} className="h-3 flex-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${config.container} ${className} relative`}>
      {!isProfile && (
        <DissRatingDialog
          maxRating={maxRating}
          gameId={gameId}
          onSaveSuccess={onSaveSuccess}
          trigger={
            <Button
              variant="outline"
              size="icon"
              className="absolute -top-7 -right-7 z-20 size-auto border-dashed bg-neutral-700 p-1 text-white opacity-90 transition-colors duration-200 hover:bg-neutral-700 hover:text-white hover:opacity-100"
              title="Edit ratings"
            >
              <SquarePen className="!h-5 !w-5" />
            </Button>
          }
        />
      )}

      {Object.entries(mergedRating).map(([category, categoryRating]) => (
        <div key={category} className="group relative flex items-center">
          {showLabels && (
            <span
              className={`${config.labelWidth} flex-shrink-0 text-gray-400 capitalize`}
              title={`${category}: ${categoryRating}/${maxRating}`}
            >
              {category}
            </span>
          )}

          <div className={`flex flex-grow ${config.gap} relative`}>
            {[...Array(maxRating)].map((_, i) => {
              const { fillColor, bgColor, fillPercent } = getBlockFillStyle(
                i,
                categoryRating,
              );
              const targetBlockIndex =
                Math.floor(categoryRating) === categoryRating
                  ? Math.max(0, Math.floor(categoryRating) - 1)
                  : Math.floor(categoryRating);
              const isTargetBlock = i === targetBlockIndex;

              return (
                <div key={i} className="relative flex-1">
                  <RatingBlock
                    $fillColor={fillColor}
                    $bgColor={bgColor}
                    $fillPercent={fillPercent}
                    className={`${config.blockHeight} cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-sm`}
                  />

                  {isTargetBlock && (
                    <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {categoryRating}/{maxRating}
                      <div className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 border-t-4 border-r-4 border-l-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!showLabels && (
            <span className="ml-2 text-xs font-medium text-gray-500">
              {categoryRating}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default DissRating;
