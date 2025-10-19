import { GameDbData, IgdbGame, SearchHistoryItem } from '@/types';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { addToSearchHistory } from '@/utils/searchHistory';

export const createGameHandlers = (
  router: AppRouterInstance,
  setInputValue: (value: string) => void,
  setShowSuggestions: (show: boolean) => void,
  setIsInputActive: (active: boolean) => void,
  setSelectedIgdbGame: (game: IgdbGame | null) => void,
  setShowDislikeModal: (show: boolean) => void,
  setSearchHistory: (history: SearchHistoryItem[]) => void,
  getSearchHistory: () => SearchHistoryItem[],
) => {
  const handleSelectSuggestion = (game: GameDbData) => {
    // Add to search history
    addToSearchHistory({
      id: game.id || game.igdb_id,
      name: game.name,
      slug: game.slug || '',
      cover_url: game.cover_url,
    });

    // Update search history state
    setSearchHistory(getSearchHistory());

    // Clear input and hide suggestions
    setInputValue('');
    setShowSuggestions(false);
    setIsInputActive(false);

    // Navigate to game detail page
    router.push(`/detail/${game.slug}`);
  };

  const handleSelectIgdbGame = (igdbGame: IgdbGame) => {
    // Add to search history (IGDB games)
    addToSearchHistory({
      id: igdbGame.id,
      name: igdbGame.name,
      slug: igdbGame.slug,
      cover_url: igdbGame.cover_url,
    });

    // Update search history state
    setSearchHistory(getSearchHistory());

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
