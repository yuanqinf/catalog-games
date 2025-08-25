'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Gamepad2, Search as SearchIconLucide, X as XIcon } from 'lucide-react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { TRENDING_ITEMS } from '@/constants/mock-search-result';
import { GameDbData } from '@/types';
import { RecentSearches, type RecentSearchItem } from '@/utils/recent-searches';
import SortingDropdown, { SortOption, SortOrder } from './sorting-dropdown';

// --- TYPE DEFINITIONS ---
type InputRef = React.RefObject<HTMLInputElement | null>;

interface InputProps {
  inputRef: InputRef;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear: (e: React.MouseEvent) => void;
}

// --- CUSTOM HOOK for Search Logic ---
const useSearchBar = () => {
  const [inputValue, setInputValue] = useState('');
  const [searchResults, setSearchResults] = useState<GameDbData[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isInputActive, setIsInputActive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setIsInputActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isInputActive) {
      inputRef.current?.focus();
    }
  }, [isInputActive]);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(RecentSearches.getRecentSearches());
  }, []);

  // Reload recent searches when suggestions are shown
  useEffect(() => {
    if (showSuggestions) {
      setRecentSearches(RecentSearches.getRecentSearches());
    }
  }, [showSuggestions]);

  useEffect(() => {
    if (!inputValue.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    clearTimeout(debounceTimeoutRef.current as NodeJS.Timeout);

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?query=${inputValue.trim()}`);
        if (response.ok) {
          const data: GameDbData[] = await response.json();
          setSearchResults(data);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimeoutRef.current as NodeJS.Timeout);
  }, [inputValue]);

  const handleImmediateSearch = (query: string) => {
    if (!query.trim()) return;
    console.log('Perform immediate search for:', query.trim());
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (game: GameDbData | RecentSearchItem) => {
    // Clear input and hide suggestions
    setInputValue('');
    setShowSuggestions(false);
    setIsInputActive(false);

    // Save to recent searches
    RecentSearches.addRecentSearch(game as RecentSearchItem);

    router.push(`/detail/${game.slug}`);
  };

  const handleClearRecentSearches = () => {
    RecentSearches.clearRecentSearches();
    setRecentSearches([]);
  };

  const handleClearInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleImmediateSearch(inputValue);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setIsInputActive(false);
    }
  };

  const handleActivate = () => setIsInputActive(true);
  const handleFocus = () => setShowSuggestions(true);

  return {
    inputValue,
    setInputValue,
    searchResults,
    recentSearches,
    isLoading,
    showSuggestions,
    isInputActive,
    wrapperRef,
    inputRef,
    handleSelectSuggestion,
    handleClearInput,
    handleInputKeyDown,
    handleActivate,
    handleFocus,
    handleClearRecentSearches,
  };
};

// --- UI SUB-COMPONENTS ---

const SearchInputField = ({
  inputRef,
  value,
  onChange,
  onFocus,
  onKeyDown,
  onClear,
  isActive,
}: InputProps & { isActive: boolean }) => (
  <div className="search-input-wrapper">
    <SearchIconLucide className="search-icon" />
    <CommandInput
      ref={inputRef}
      value={value}
      onValueChange={onChange}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      placeholder="Search"
      hideDefaultIcon
      wrapperClassName={`${isActive ? 'w-full' : ''} border-0 p-0 h-full`}
      className={`${isActive ? '' : 'cursor-pointer'} h-full rounded-md border-0 bg-transparent pr-9 pl-9 text-sm text-zinc-100 shadow-none placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0`}
    />
    {value && <XIcon className="search-clear-icon" onClick={onClear} />}
  </div>
);

const SuggestionItem = ({
  item,
  onSelect,
  isGame = false,
}: {
  item: { text: string; tag?: string } | GameDbData | RecentSearchItem;
  onSelect: (value: any) => void;
  isGame?: boolean;
}) => {
  if (isGame) {
    const game = item as GameDbData | RecentSearchItem;
    return (
      <CommandItem
        className="cursor-pointer transition-colors duration-200 hover:bg-zinc-700"
        onSelect={() => onSelect(game)}
      >
        <div className="flex w-full items-center gap-3">
          {game.cover_url && (
            <img
              src={game.cover_url}
              alt={game.name}
              className="h-10 w-8 rounded object-cover"
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{game.name}</span>
            {game.developers?.[0] && (
              <span className="truncate text-xs text-zinc-400">
                {game.developers[0]}
              </span>
            )}
          </div>
          {'first_release_date' in game && game.first_release_date && (
            <span className="text-xs text-zinc-500">
              {new Date(game.first_release_date).getFullYear()}
            </span>
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

const SearchSuggestions = ({
  inputValue,
  onSelectSuggestion,
  onSelectGame,
  searchResults,
  recentSearches,
  onClearRecentSearches,
  isLoading,
}: {
  inputValue: string;
  onSelectSuggestion: (value: string) => void;
  onSelectGame: (game: GameDbData | RecentSearchItem) => void;
  searchResults: GameDbData[];
  recentSearches: RecentSearchItem[];
  onClearRecentSearches: () => void;
  isLoading: boolean;
}) => {
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
                <CommandGroup heading="Recent">
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
                      className="text-xs text-zinc-400 transition-colors hover:text-zinc-200"
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
            <CommandGroup heading="Trending">
              {TRENDING_ITEMS.map((item) => (
                <SuggestionItem
                  key={item.text}
                  item={item}
                  onSelect={onSelectSuggestion}
                />
              ))}
            </CommandGroup>
          </>
        ) : (
          !isLoading &&
          searchResults.length > 0 && (
            <CommandGroup heading="Games">
              {searchResults.map((game) => (
                <SuggestionItem
                  key={game.id}
                  item={game}
                  onSelect={onSelectGame}
                  isGame={true}
                />
              ))}
            </CommandGroup>
          )
        )}
      </CommandList>
    </div>
  );
};

const SearchSection = ({
  isInputActive,
  ...props
}: ReturnType<typeof useSearchBar>) => {
  const pathname = usePathname();
  const isExplorePage = pathname === '/explore';

  const handleSortChange = (option: SortOption, order: SortOrder) => {
    console.log(`Sort changed: ${option} - ${order}`);
    // Add your sort logic here
  };

  if (!isInputActive) {
    return (
      <div className="flex items-center gap-2">
        <Command
          shouldFilter={false}
          className="cursor-pointer overflow-visible"
          onClick={props.handleActivate}
        >
          <SearchInputField
            inputRef={props.inputRef}
            value={props.inputValue}
            onChange={props.setInputValue}
            onFocus={props.handleFocus}
            onKeyDown={props.handleInputKeyDown}
            onClear={props.handleClearInput}
            isActive={false}
          />
        </Command>
        {isExplorePage ? (
          <SortingDropdown onSortChange={handleSortChange} />
        ) : (
          <Link href={isExplorePage ? '' : '/explore'}>
            <Button>
              <Gamepad2 />
              <p>Explore</p>
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <Command shouldFilter={false} className="overflow-visible">
      <SearchInputField
        inputRef={props.inputRef}
        value={props.inputValue}
        onChange={props.setInputValue}
        onFocus={props.handleFocus}
        onKeyDown={props.handleInputKeyDown}
        onClear={props.handleClearInput}
        isActive={true}
      />
      {props.showSuggestions && (
        <SearchSuggestions
          inputValue={props.inputValue}
          onSelectSuggestion={(text: string) => {
            props.setInputValue(text);
            props.handleFocus();
          }}
          onSelectGame={props.handleSelectSuggestion}
          searchResults={props.searchResults}
          recentSearches={props.recentSearches}
          onClearRecentSearches={props.handleClearRecentSearches}
          isLoading={props.isLoading}
        />
      )}
    </Command>
  );
};

// --- MAIN COMPONENT ---
const SearchBar = () => {
  const searchProps = useSearchBar();
  return (
    <div
      ref={searchProps.wrapperRef}
      className="relative mx-auto w-full max-w-xl"
    >
      <SearchSection {...searchProps} />
    </div>
  );
};

export default SearchBar;
