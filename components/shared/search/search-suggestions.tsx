'use client';

import React from 'react';
import {
  CommandList,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';
import { GameDbData, IgdbGame } from '@/types';
import { SuggestionItem } from './suggestion-item';

interface SearchSuggestionsProps {
  onSelectGame: (game: any) => void;
  onSelectIgdbGame: (game: any) => void;
  supabaseGames: GameDbData[];
  igdbGames: IgdbGame[];
  isLoading: boolean;
}

export const SearchSuggestions = ({
  onSelectGame,
  onSelectIgdbGame,
  supabaseGames,
  igdbGames,
  isLoading,
}: SearchSuggestionsProps) => {
  return (
    <div className="search-dropdown">
      <CommandList>
        <CommandEmpty>
          {isLoading ? 'Searching...' : 'No results found.'}
        </CommandEmpty>

        {!isLoading &&
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
                />
              ))}
            </CommandGroup>
          )}
      </CommandList>
    </div>
  );
};
