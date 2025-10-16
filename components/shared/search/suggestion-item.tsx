'use client';

import React from 'react';
import { Gamepad2, ThumbsDown, Ghost } from 'lucide-react';
import { CommandItem } from '@/components/ui/command';
import {
  GameDbData,
  IgdbGame,
  SuggestionItem as SuggestionItemType,
} from '@/types';
import Image from 'next/image';
import NumberFlow from '@number-flow/react';

interface SuggestionItemProps {
  item: SuggestionItemType;
  onSelect: (value: any) => void;
  isGame?: boolean;
}

const extractDeveloper = (game: GameDbData | IgdbGame): string => {
  if ('developers' in game) {
    return game.developers?.[0] || '';
  }

  if ('involved_companies' in game) {
    const developerCompany = game.involved_companies?.find(
      (company) => company.developer || !company.publisher,
    );
    return developerCompany?.company.name || '';
  }

  return '';
};

const extractDislikeCount = (game: GameDbData | IgdbGame): number | null => {
  return 'dislike_count' in game && game.dislike_count && game.dislike_count > 0
    ? game.dislike_count
    : null;
};

const extractGhostCount = (game: GameDbData | IgdbGame): number | null => {
  return 'ghost_count' in game && game.ghost_count && game.ghost_count > 0
    ? game.ghost_count
    : null;
};

const isDeadGame = (game: GameDbData | IgdbGame): boolean => {
  return 'is_dead' in game && game.is_dead === true;
};

const getGameDetails = (game: GameDbData | IgdbGame) => {
  const isIgdbGame = !('cover_url' in game);
  const developer = extractDeveloper(game);
  const dislikeCount = extractDislikeCount(game);
  const ghostCount = extractGhostCount(game);
  const isDead = isDeadGame(game);

  return { isIgdbGame, developer, dislikeCount, ghostCount, isDead };
};

export const SuggestionItem = ({
  item,
  onSelect,
  isGame = false,
}: SuggestionItemProps) => {
  if (isGame) {
    const game = item as GameDbData | IgdbGame;
    const { developer, dislikeCount, ghostCount, isDead } =
      getGameDetails(game);

    return (
      <CommandItem
        className="cursor-pointer transition-colors duration-200 hover:bg-zinc-700"
        onSelect={() => onSelect(game)}
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
              <Gamepad2 className="h-4 w-4 text-zinc-400" />
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
          {/* Show ghost count for dead games, dislike count for normal games */}
          {isDead ? (
            ghostCount ? (
              <div className="flex items-center gap-1 text-xs text-zinc-300">
                <Ghost className="h-3 w-3 text-zinc-300" fill="currentColor" />
                <NumberFlow value={ghostCount} />
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <Ghost className="h-3 w-3" />
                <span>RIP</span>
              </div>
            )
          ) : dislikeCount ? (
            <div className="flex items-center gap-1 text-xs text-red-400">
              <ThumbsDown
                className="drop-shadow-2xl' h-3 w-3 text-red-500"
                fill="currentColor"
              />
              <NumberFlow value={dislikeCount} />
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
