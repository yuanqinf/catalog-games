import { TAILWIND_BORDER_COLORS } from '@/constants/colors';

/**
 * Get avatar border color class based on Steam review sentiment
 * @param review - Steam review string (e.g., "Very Positive", "Mixed", "Negative")
 * @returns Tailwind border color class
 */
export const getAvatarBorderColor = (review?: string): string => {
  if (!review?.trim()) return TAILWIND_BORDER_COLORS.neutral;

  const lowerReview = review.toLowerCase();
  if (lowerReview.includes('positive')) return 'border-green-500';
  if (lowerReview.includes('negative')) return 'border-red-500';
  if (lowerReview.includes('mixed')) return 'border-yellow-400';
  return TAILWIND_BORDER_COLORS.neutral;
};
