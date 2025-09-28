interface RecentSearchItem {
  id: string;
  name: string;
  slug: string;
  cover_url?: string;
  developers?: string[];
  searchedAt: string;
  dislike_count?: number;
}

const RECENT_SEARCHES_KEY = 'catalog-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export class RecentSearches {
  /**
   * Get all recent searches from localStorage
   */
  static getRecentSearches(): RecentSearchItem[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored) return [];

      const searches = JSON.parse(stored) as RecentSearchItem[];
      return searches.sort(
        (a, b) =>
          new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime(),
      );
    } catch (error) {
      console.error('Failed to parse recent searches:', error);
      return [];
    }
  }

  /**
   * Add a game to recent searches
   */
  static addRecentSearch(game: {
    id: string | number;
    name: string;
    slug: string;
    cover_url?: string;
    developers?: string[];
    dislike_count?: number;
  }): void {
    if (typeof window === 'undefined') return;

    try {
      const currentSearches = this.getRecentSearches();

      // Remove existing entry for this game (to avoid duplicates)
      const filteredSearches = currentSearches.filter(
        (search) => search.slug !== game.slug,
      );

      // Create new search item
      const newSearch: RecentSearchItem = {
        id: String(game.id),
        name: game.name,
        slug: game.slug,
        cover_url: game.cover_url,
        developers: game.developers,
        dislike_count: game.dislike_count,
        searchedAt: new Date().toISOString(),
      };

      // Add to beginning and limit to max
      const updatedSearches = [newSearch, ...filteredSearches].slice(
        0,
        MAX_RECENT_SEARCHES,
      );

      localStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(updatedSearches),
      );
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  }

  /**
   * Clear all recent searches
   */
  static clearRecentSearches(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }

  /**
   * Remove a specific search from recent searches
   */
  static removeRecentSearch(slug: string): void {
    if (typeof window === 'undefined') return;

    try {
      const currentSearches = this.getRecentSearches();
      const filteredSearches = currentSearches.filter(
        (search) => search.slug !== slug,
      );

      localStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(filteredSearches),
      );
    } catch (error) {
      console.error('Failed to remove recent search:', error);
    }
  }
}

export type { RecentSearchItem };
