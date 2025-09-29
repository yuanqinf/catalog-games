import { GameDbData, IgdbGame } from '@/types';
import { RecentSearches, RecentSearchItem } from '@/utils/recent-searches';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export const createGameHandlers = (
  router: AppRouterInstance,
  setInputValue: (value: string) => void,
  setShowSuggestions: (show: boolean) => void,
  setIsInputActive: (active: boolean) => void,
  setSelectedIgdbGame: (game: IgdbGame | null) => void,
  setShowDislikeModal: (show: boolean) => void,
) => {
  const handleSelectSuggestion = (game: GameDbData | RecentSearchItem) => {
    // Clear input and hide suggestions
    setInputValue('');
    setShowSuggestions(false);
    setIsInputActive(false);

    // Save to recent searches with proper dislike_count
    const recentSearchItem: RecentSearchItem = {
      id: String(game.id),
      name: game.name,
      slug: game.slug || '',
      cover_url: game.cover_url || undefined,
      developers: game.developers || undefined,
      dislike_count:
        'dislike_count' in game ? game.dislike_count || undefined : undefined,
      searchedAt: new Date().toISOString(), // This will be overwritten by addRecentSearch
    };
    RecentSearches.addRecentSearch(recentSearchItem);
    router.push(`/detail/${game.slug}`);
  };

  const handleSelectIgdbGame = (igdbGame: IgdbGame) => {
    // Clear input and hide suggestions
    setInputValue('');
    setShowSuggestions(false);
    setIsInputActive(false);

    // Show dislike modal
    setSelectedIgdbGame(igdbGame);
    setShowDislikeModal(true);
  };
  return {
    handleSelectSuggestion,
    handleSelectIgdbGame,
  };
};
