import { SearchHistoryItem } from '@/types';

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 5;

export const getSearchHistory = (): SearchHistoryItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to get search history:', error);
    return [];
  }
};

export const addToSearchHistory = (
  item: Omit<SearchHistoryItem, 'timestamp'>,
): void => {
  if (typeof window === 'undefined') return;

  try {
    const history = getSearchHistory();

    // Remove duplicate if exists (by id or slug)
    const filtered = history.filter(
      (h) => h.id !== item.id && h.slug !== item.slug,
    );

    // Add new item at the beginning with timestamp
    const newHistory: SearchHistoryItem[] = [
      { ...item, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY_ITEMS); // Keep only the last MAX_HISTORY_ITEMS

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
};

export const clearSearchHistory = (): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
};
