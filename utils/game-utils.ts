import { ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { TAILWIND_TEXT_COLORS } from '@/constants/colors';

export type SteamReviewPresentation = {
  IconComponent: React.ElementType;
  colorClass: string;
  label: string;
};

/**
 * Get Steam review presentation data based on review sentiment
 * @param review - Steam review string (e.g., "Very Positive", "Mixed", "Negative")
 * @returns SteamReviewPresentation object with icon, color, and label
 */
export const getSteamReviewPresentation = (
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
