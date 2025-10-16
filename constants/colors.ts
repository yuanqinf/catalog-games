// Central color constants for consistent styling
// Tailwind CSS class names for text colors
export const TAILWIND_TEXT_COLORS = {
  neutral: 'text-neutral-400',
  positive: 'text-green-500',
  negative: 'text-red-500',
  mixed: 'text-yellow-400',
} as const;

// Tailwind CSS class names for border colors
export const TAILWIND_BORDER_COLORS = {
  neutral: 'border-neutral-700',
} as const;

// Hex colors for rating block fills (index 0 → level-1 etc.)
// Red gradient: Light → Dark for dislike intensity
export const RATING_BLOCK_COLORS: readonly string[] = [
  '#FFD93B',
  '#FFB02E',
  '#FF6B2C',
  '#FF2B1C',
  '#E7000B',
];

export const EMPTY_BLOCK_COLOR = '#404040'; // neutral-700 hex
