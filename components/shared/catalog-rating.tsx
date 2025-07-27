import React from 'react';
import styled from 'styled-components';
import { RATING_BLOCK_COLORS, EMPTY_BLOCK_COLOR } from '@/constants/colors';

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

interface CatalogRatingProps {
  rating?: Partial<GameRating>;
  maxRating?: number;
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const defaultRating: GameRating = {
  story: 0,
  music: 0,
  graphics: 0,
  gameplay: 0,
  longevity: 0,
};

const CatalogRating: React.FC<CatalogRatingProps> = ({
  rating = defaultRating,
  maxRating = 5,
  className = '',
  showLabels = true,
  size = 'md',
}) => {
  /**
   * Generates the appropriate style object for a rating block based on the rating value
   * @param blockIndex - The index of the block (0-4, representing rating levels 1-5)
   * @param categoryRating - The actual rating value (can be a float like 3.5)
   * @returns A React inline style object with the appropriate background color or gradient
   */
  const getBlockFillStyle = (blockIndex: number, categoryRating: number) => {
    const fullValue = Math.floor(categoryRating);
    const fractionalPart = categoryRating - fullValue;

    // Get the appropriate colors for this block
    const fillColor = RATING_BLOCK_COLORS[blockIndex] || EMPTY_BLOCK_COLOR;
    const bgColor = EMPTY_BLOCK_COLOR; // Empty/unfilled portion color

    // Calculate how much of this block should be filled (0-100%)
    let fillPercent = 0;
    if (blockIndex < fullValue) {
      // Blocks before the current rating level are completely filled
      fillPercent = 100;
    } else if (blockIndex === fullValue) {
      // The current level block is partially filled based on the decimal part
      fillPercent = Math.round(fractionalPart * 100);
    }
    // Blocks after the current level remain at 0% fill

    return { fillColor, bgColor, fillPercent };
  };

  // Size configurations
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
  };

  const config = sizeConfig[size];
  const mergedRating = { ...defaultRating, ...rating };

  return (
    <div className={`${config.container} ${className}`}>
      {Object.entries(mergedRating).map(([category, categoryRating]) => (
        <div key={category} className="group relative flex items-center">
          {showLabels && (
            <span
              className={`${config.labelWidth} flex-shrink-0 text-neutral-400 capitalize`}
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

              // Calculate if this block should show the tooltip
              const targetBlockIndex =
                Math.floor(categoryRating) === categoryRating
                  ? Math.max(0, Math.floor(categoryRating) - 1) // For exact ratings like 4.0, show above the last filled block
                  : Math.floor(categoryRating); // For partial ratings like 4.3, show above the partially filled block

              const isTargetBlock = i === targetBlockIndex;

              return (
                <div key={i} className="relative flex-1">
                  <RatingBlock
                    $fillColor={fillColor}
                    $bgColor={bgColor}
                    $fillPercent={fillPercent}
                    className={`${config.blockHeight} cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-sm`}
                  />

                  {/* Hover tooltip positioned above the target block */}
                  {isTargetBlock && (
                    <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {categoryRating.toFixed(1)}/{maxRating}
                      {/* Arrow pointing down */}
                      <div className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 border-t-4 border-r-4 border-l-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!showLabels && (
            <span className="ml-2 text-xs font-medium text-neutral-500">
              {categoryRating.toFixed(1)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CatalogRating;
