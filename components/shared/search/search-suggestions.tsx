'use client';

import {
  CommandList,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';
import type { GameDbData, IgdbGame, SearchHistoryItem } from '@/types';
import { useTranslation } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { SuggestionItem } from './suggestion-item';

interface SearchSuggestionsProps {
  onSelectGame: (game: GameDbData | IgdbGame) => void;
  onSelectIgdbGame: (game: IgdbGame) => void;
  supabaseGames: GameDbData[];
  igdbGames: IgdbGame[];
  searchHistory: SearchHistoryItem[];
  isLoading: boolean;
  onOpenFeedback: () => void;
  onClearHistory: () => void;
  hasSearchInput?: boolean;
  hasSearched?: boolean;
}

export const SearchSuggestions = ({
  onSelectGame,
  onSelectIgdbGame,
  supabaseGames,
  igdbGames,
  searchHistory,
  isLoading,
  onOpenFeedback,
  onClearHistory,
  hasSearchInput = false,
  hasSearched = false,
}: SearchSuggestionsProps) => {
  const { t } = useTranslation();

  const hasSearchResults = supabaseGames.length > 0 || igdbGames.length > 0;
  // Show history when: not loading, no search results yet, and has history
  const showHistory =
    !isLoading && !hasSearchResults && searchHistory.length > 0;
  // Show "no results" message only when search has completed and no results found
  const showNoResultsMessage =
    !isLoading && hasSearchInput && !hasSearchResults && hasSearched;

  return (
    <div className="search-dropdown">
      <CommandList>
        <CommandEmpty>
          {isLoading ? t('search_searching') : t('search_no_results_found')}
          <div className="mt-2 flex items-center justify-center gap-2">
            <p className="text-xs text-gray-400">
              {t('search_missing_game_lets_know')}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenFeedback}
              className="!h-3.5 !w-3.5 text-white transition-all duration-200 hover:scale-110"
            >
              <MessageCircle className="!h-4 !w-4 fill-current" />
            </Button>
          </div>
        </CommandEmpty>

        {/* Show "No results" message before showing search history */}
        {showNoResultsMessage && searchHistory.length > 0 && (
          <div className="border-b border-gray-700 px-4 py-3">
            <p className="text-center text-sm text-gray-300">
              {t('search_no_results_found')}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <p className="text-xs text-gray-400">
                {t('search_missing_game_lets_know')}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenFeedback}
                className="!h-3.5 !w-3.5 text-white transition-all duration-200 hover:scale-110"
              >
                <MessageCircle className="!h-4 !w-4 fill-current" />
              </Button>
            </div>
          </div>
        )}

        {/* Show search history when no input */}
        {showHistory && (
          <CommandGroup
            heading={
              <div className="flex items-center justify-between">
                <span>{t('search_recent_searches')}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearHistory();
                  }}
                  className="h-auto px-2 py-1 text-xs text-gray-400 hover:text-white"
                >
                  {t('search_clear_history')}
                </Button>
              </div>
            }
          >
            {searchHistory.map((historyItem) => (
              <SuggestionItem
                key={`history-${historyItem.id}`}
                item={{
                  id: historyItem.id,
                  name: historyItem.name,
                  slug: historyItem.slug,
                  cover_url: historyItem.cover_url,
                  igdb_id: historyItem.id,
                }}
                onSelect={(value) =>
                  onSelectGame(value as GameDbData | IgdbGame)
                }
                isGame={true}
                isHistory={true}
              />
            ))}
          </CommandGroup>
        )}

        {/* Show search results */}
        {!isLoading && hasSearchResults && (
          <CommandGroup heading={t('search_results')}>
            {/* Supabase Games first (priority) */}
            {supabaseGames.map((game) => (
              <SuggestionItem
                key={`supabase-${game.id}`}
                item={game}
                onSelect={(value) =>
                  onSelectGame(value as GameDbData | IgdbGame)
                }
                isGame={true}
              />
            ))}

            {/* IGDB Games after Supabase games */}
            {igdbGames.map((game) => (
              <SuggestionItem
                key={`igdb-${game.id}`}
                item={game}
                onSelect={(value) => onSelectIgdbGame(value as IgdbGame)}
                isGame={true}
              />
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </div>
  );
};
