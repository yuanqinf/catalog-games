'use client';

import {
  CommandList,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';
import { GameDbData, IgdbGame } from '@/types';
import { SuggestionItem } from './suggestion-item';
import { useTranslation } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface SearchSuggestionsProps {
  onSelectGame: (game: any) => void;
  onSelectIgdbGame: (game: any) => void;
  supabaseGames: GameDbData[];
  igdbGames: IgdbGame[];
  isLoading: boolean;
  onOpenFeedback: () => void;
}

export const SearchSuggestions = ({
  onSelectGame,
  onSelectIgdbGame,
  supabaseGames,
  igdbGames,
  isLoading,
  onOpenFeedback,
}: SearchSuggestionsProps) => {
  const { t } = useTranslation();

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

        {!isLoading && (supabaseGames.length > 0 || igdbGames.length > 0) && (
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
