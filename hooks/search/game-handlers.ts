import { GameDbData, IgdbGame } from '@/types';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export const createGameHandlers = (
  router: AppRouterInstance,
  setInputValue: (value: string) => void,
  setShowSuggestions: (show: boolean) => void,
  setIsInputActive: (active: boolean) => void,
  setSelectedIgdbGame: (game: IgdbGame | null) => void,
  setShowDislikeModal: (show: boolean) => void,
) => {
  const handleSelectSuggestion = (game: GameDbData) => {
    // Clear input and hide suggestions
    setInputValue('');
    setShowSuggestions(false);
    setIsInputActive(false);

    // Navigate to game detail page
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
