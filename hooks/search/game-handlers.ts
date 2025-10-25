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
  setSupabaseGames: (games: GameDbData[]) => void,
  setIgdbGames: (games: IgdbGame[]) => void,
) => {
  const handleSelectSuggestion = (game: GameDbData | IgdbGame) => {
    // Add to search history
    addToSearchHistory({
      id: 'igdb_id' in game ? game.id || game.igdb_id : game.id,
      name: game.name,
      slug: game.slug || '',
      cover_url: 'cover_url' in game ? game.cover_url : undefined,
    });

    // Update search history state
    setSearchHistory(getSearchHistory());

    // Clear search results, input and hide suggestions
    setSupabaseGames([]);
    setIgdbGames([]);
    setInputValue('');
    setShowSuggestions(false);
    setIsInputActive(false);

    // Navigate to game detail page
    router.push(`/detail/${game.slug}`);
  };

  const handleSelectIgdbGame = (igdbGame: IgdbGame) => {
    // Clear search results, input and hide suggestions
    setSupabaseGames([]);
    setIgdbGames([]);
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
