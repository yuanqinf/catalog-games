import type { RankedGame } from './mock-ranking-data';

export type RankingType = RankedGame['rankingType'];

export const rankingTypes: { value: RankingType; label: string }[] = [
  { value: 'overall', label: 'Overall' },
  { value: 'story', label: 'Story' },
  { value: 'graphics', label: 'Graphics' },
  { value: 'gameplay', label: 'Gameplay' },
  { value: 'longevity', label: 'Longevity' },
  { value: 'music', label: 'Music' },
];

// Rating categories for user ratings (excluding 'overall')
export const ratingCategories = [
  { key: 'story', label: 'Story' },
  { key: 'music', label: 'Music' },
  { key: 'graphics', label: 'Graphics' },
  { key: 'gameplay', label: 'Gameplay' },
  { key: 'longevity', label: 'Longevity' },
] as const;

export type RatingCategoryKey = (typeof ratingCategories)[number]['key'];
