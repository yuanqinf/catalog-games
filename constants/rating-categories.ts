// Rating categories for user ratings
export const ratingCategories = [
  { key: 'story', label: 'Story' },
  { key: 'music', label: 'Music' },
  { key: 'graphics', label: 'Graphics' },
  { key: 'gameplay', label: 'Gameplay' },
  { key: 'longevity', label: 'Longevity' },
] as const;

export type RatingCategoryKey = (typeof ratingCategories)[number]['key'];
