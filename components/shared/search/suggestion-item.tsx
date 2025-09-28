'use client';

import React from 'react';
import { Gamepad2, Loader2, ThumbsDown } from 'lucide-react';
import { CommandItem } from '@/components/ui/command';
import {
  GameDbData,
  IgdbGame,
  SuggestionItem as SuggestionItemType,
} from '@/types';
import { RecentSearchItem } from '@/utils/recent-searches';
import Image from 'next/image';

interface SuggestionItemProps {
  item: SuggestionItemType;
  onSelect: (value: any) => void;
  isGame?: boolean;
  isAddingGame?: boolean;
}

const getGameDetails = (game: GameDbData | RecentSearchItem | IgdbGame) => {
  // Check if this is an IGDB game (no cover_url property)
  const isIgdbGame = !('cover_url' in game);

  // Handle developers for both formats
  let developer = '';
  if ('developers' in game && game.developers?.[0]) {
    // Supabase format
    developer = game.developers[0];
  } else if ('involved_companies' in game && game.involved_companies) {
    // IGDB format - find the first developer company
    const developerCompany = game.involved_companies.find(
      (company) => company.developer || !company.publisher,
    );
    if (developerCompany) {
      developer = developerCompany.company.name;
    }
  }

  // Handle dislike count (for both Supabase games and recent searches)
  let dislikeCount = null;
  if ('dislike_count' in game && game.dislike_count && game.dislike_count > 0) {
    dislikeCount = game.dislike_count;
  }

  return { isIgdbGame, developer, dislikeCount };
};

export const SuggestionItem = ({
  item,
  onSelect,
  isGame = false,
  isAddingGame = false,
}: SuggestionItemProps) => {
  if (isGame) {
    const game = item as GameDbData | RecentSearchItem | IgdbGame;
    const { isIgdbGame, developer, dislikeCount } = getGameDetails(game);

    console.log(game);
    return (
      <CommandItem
        className={`transition-colors duration-200 ${
          isIgdbGame && isAddingGame
            ? 'cursor-not-allowed opacity-75'
            : 'cursor-pointer hover:bg-zinc-700'
        }`}
        onSelect={() => {
          if (!(isIgdbGame && isAddingGame)) {
            onSelect(game);
          }
        }}
      >
        <div className="flex w-full items-center gap-3">
          {/* Supabase games show cover, IGDB games show gamepad icon or loading spinner */}
          {'cover_url' in game && game.cover_url ? (
            <Image
              src={game.cover_url}
              alt={game.name}
              className="h-10 w-8 rounded object-cover"
              width={32}
              height={32}
            />
          ) : (
            <div className="flex h-10 w-8 items-center justify-center rounded bg-zinc-800">
              {isIgdbGame && isAddingGame ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              ) : (
                <Gamepad2 className="h-4 w-4 text-zinc-400" />
              )}
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{game.name}</span>
            {developer && (
              <span className="truncate text-xs text-zinc-400">
                {developer}
              </span>
            )}
          </div>
          {/* Dislike count or dislike button */}
          {dislikeCount ? (
            <div className="flex items-center gap-1 text-xs text-red-400">
              <ThumbsDown
                className="drop-shadow-2xl' h-3 w-3 text-red-500"
                fill="currentColor"
              />
              <span>{dislikeCount.toLocaleString()}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <ThumbsDown className="h-3 w-3" />
              <span>Be the first to dislike</span>
            </div>
          )}
        </div>
      </CommandItem>
    );
  }

  const simpleItem = item as { text: string; tag?: string };
  return (
    <CommandItem
      className="cursor-pointer transition-colors duration-200 hover:bg-zinc-700"
      onSelect={() => onSelect(simpleItem.text)}
    >
      {simpleItem.text}
      {simpleItem.tag && (
        <span className="ml-2 rounded-sm bg-zinc-600 px-1.5 py-0.5 text-xs text-zinc-300">
          {simpleItem.tag}
        </span>
      )}
    </CommandItem>
  );
};
