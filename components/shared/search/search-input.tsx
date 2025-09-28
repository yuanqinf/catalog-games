'use client';

import React from 'react';
import { Search as SearchIconLucide, X as XIcon, Loader2 } from 'lucide-react';
import { CommandInput } from '@/components/ui/command';

interface SearchInputProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear: (e: React.MouseEvent) => void;
  isActive: boolean;
  isAddingGame: boolean;
  isLoading?: boolean;
}

export const SearchInput = ({
  inputRef,
  value,
  onChange,
  onFocus,
  onKeyDown,
  onClear,
  isActive,
  isAddingGame,
  isLoading = false,
}: SearchInputProps) => (
  <div className="search-input-wrapper">
    {isAddingGame || isLoading ? (
      <Loader2 className="search-icon animate-spin text-zinc-400" />
    ) : (
      <SearchIconLucide className="search-icon" />
    )}
    <CommandInput
      ref={inputRef}
      value={isAddingGame ? 'Loading game...' : value}
      onValueChange={isAddingGame ? () => {} : onChange}
      onFocus={isAddingGame ? () => {} : onFocus}
      onKeyDown={isAddingGame ? () => {} : onKeyDown}
      placeholder={isAddingGame ? 'Loading game data...' : 'Search'}
      hideDefaultIcon
      disabled={isAddingGame}
      wrapperClassName={`${isActive ? 'w-full' : ''} border-0 p-0 h-full`}
      className={`${isActive && !isAddingGame ? '' : 'cursor-pointer'} h-full rounded-md border-0 bg-transparent pr-9 pl-9 text-sm ${
        isAddingGame ? 'text-zinc-300' : 'text-zinc-100'
      } shadow-none placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 ${
        isAddingGame ? 'cursor-not-allowed' : ''
      }`}
    />
    {value && !isAddingGame && (
      <XIcon className="search-clear-icon" onClick={onClear} />
    )}
  </div>
);
