import { GameDbData, IgdbGame } from '@/types';

/**
 * Sort Supabase games by release date (most recent first)
 */
export const sortSupabaseGamesByDate = (
  a: GameDbData,
  b: GameDbData,
): number => {
  // Handle null/undefined dates - put them at the end
  if (!a.first_release_date && !b.first_release_date) return 0;
  if (!a.first_release_date) return 1;
  if (!b.first_release_date) return -1;

  // Convert string dates to timestamps and sort descending (most recent first)
  const timestampA = new Date(a.first_release_date).getTime();
  const timestampB = new Date(b.first_release_date).getTime();
  return timestampB - timestampA;
};

/**
 * Sort IGDB games by release date (most recent first)
 */
export const sortIgdbGamesByDate = (a: IgdbGame, b: IgdbGame): number => {
  // Handle null/undefined dates - put them at the end
  if (!a.first_release_date && !b.first_release_date) return 0;
  if (!a.first_release_date) return 1;
  if (!b.first_release_date) return -1;

  // Sort by Unix timestamp descending (most recent first)
  return b.first_release_date - a.first_release_date;
};
