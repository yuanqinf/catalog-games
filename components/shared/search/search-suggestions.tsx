'use client';

import React from 'react';
import {
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandSeparator,
} from '@/components/ui/command';
import { GameDbData, IgdbGame } from '@/types';
import { RecentSearchItem } from '@/utils/recent-searches';
import { SuggestionItem } from './suggestion-item';

interface SearchSuggestionsProps {
  inputValue: string;
  onSelectSuggestion: (value: any) => void;
  onSelectGame: (game: any) => void;
  onSelectIgdbGame: (game: any) => void;
  supabaseGames: GameDbData[];
  igdbGames: IgdbGame[];
  recentSearches: RecentSearchItem[];
  onClearRecentSearches: () => void;
  isLoading: boolean;
  isAddingGame: boolean;
}

export const SearchSuggestions = ({
  inputValue,
  onSelectSuggestion,
  onSelectGame,
  onSelectIgdbGame,
  supabaseGames,
  igdbGames,
  recentSearches,
  onClearRecentSearches,
  isLoading,
  isAddingGame,
}: SearchSuggestionsProps) => {
  const showDefaultSuggestions = !inputValue.trim();

  return (
    <div className="search-dropdown">
      <CommandList>
        <CommandEmpty>
          {isLoading ? 'Searching...' : 'No results found.'}
        </CommandEmpty>

        {showDefaultSuggestions ? (
          <>
            {recentSearches.length > 0 && (
              <>
                <CommandGroup>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs text-zinc-500">
                      Recent Searches
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClearRecentSearches();
                      }}
                      className="cursor-pointer text-xs text-zinc-400 transition-colors hover:text-zinc-200"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((game) => (
                    <SuggestionItem
                      key={game.slug}
                      item={game}
                      onSelect={onSelectGame}
                      isGame={true}
                    />
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
          </>
        ) : (
          !isLoading &&
          (supabaseGames.length > 0 || igdbGames.length > 0) && (
            <CommandGroup heading="Search Results">
              {/* Supabase Games first (priority) */}
              {supabaseGames.map((game) => (
                <SuggestionItem
                  key={`supabase-${game.id}`}
                  item={game}
                  onSelect={onSelectGame}
                  isGame={true}
                />
              ))}

              {/* IGDB Games after Supabase games */}
              {igdbGames.map((game) => (
                <SuggestionItem
                  key={`igdb-${game.id}`}
                  item={game}
                  onSelect={onSelectIgdbGame}
                  isGame={true}
                  isAddingGame={isAddingGame}
                />
              ))}
            </CommandGroup>
          )
        )}
      </CommandList>
    </div>
  );
};
