import { GameDbData, IgdbGame } from '@/types';
import { RecentSearches, RecentSearchItem } from '@/utils/recent-searches';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { GameService } from '@/lib/supabase/client';

export const createGameHandlers = (
  router: AppRouterInstance,
  setInputValue: (value: string) => void,
  setShowSuggestions: (show: boolean) => void,
  setIsInputActive: (active: boolean) => void,
  setIsAddingGame: (adding: boolean) => void,
) => {
  const handleSelectSuggestion = (game: GameDbData | RecentSearchItem) => {
    // Clear input and hide suggestions
    setInputValue('');
    setShowSuggestions(false);
    setIsInputActive(false);

    // Save to recent searches
    RecentSearches.addRecentSearch(game as RecentSearchItem);
    router.push(`/detail/${game.slug}`);
  };

  const handleSelectIgdbGame = async (igdbGame: IgdbGame) => {
    // Clear input and hide suggestions
    setInputValue('');
    setShowSuggestions(false);
    setIsInputActive(false);

    // Set loading state
    setIsAddingGame(true);

    try {
      console.log(
        `🎮 Adding IGDB game to database: ${igdbGame.name} (ID: ${igdbGame.id})`,
      );

      // Fetch complete IGDB data
      const igdbResponse = await fetch(`/api/igdb/games/${igdbGame.id}`);
      if (!igdbResponse.ok) {
        throw new Error('Failed to fetch complete IGDB data');
      }
      const fullIgdbData = await igdbResponse.json();

      // Add game to database
      const response = await fetch('/api/games/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          igdbData: fullIgdbData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add game to database');
      }

      const addResult = await response.json();
      console.log(`✅ Successfully added game: ${igdbGame.name}`);

      // Attempt to fetch OpenCritic reviews for the newly added game
      try {
        const gameService = new GameService();
        const gameId = addResult.data?.id;

        if (gameId) {
          console.log(
            `📝 Attempting to fetch OpenCritic reviews for: ${igdbGame.name}`,
          );
          await gameService.addOpenCriticReviews(gameId, igdbGame.name);
          console.log(
            `✅ OpenCritic review fetch completed for: ${igdbGame.name}`,
          );
        }
      } catch (reviewError) {
        // Fail silently as requested
        console.warn(
          `Failed to fetch OpenCritic reviews for ${igdbGame.name}:`,
          reviewError,
        );
      }

      // Navigate to the new game's detail page
      router.push(`/detail/${igdbGame.slug}`);
    } catch (error) {
      console.error('Failed to add IGDB game:', error);
    } finally {
      setIsAddingGame(false);
    }
  };

  const handleImmediateSearch = (query: string) => {
    if (!query.trim()) return;
    console.log('Perform immediate search for:', query.trim());
    setShowSuggestions(false);
  };

  return {
    handleSelectSuggestion,
    handleSelectIgdbGame,
    handleImmediateSearch,
  };
};
