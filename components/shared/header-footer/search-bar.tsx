'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Gamepad2,
  Search as SearchIconLucide,
  X as XIcon,
  Loader2,
} from 'lucide-react';
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
import { GameDbData, IgdbGame } from '@/types';
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

// --- TYPES FOR HYBRID SEARCH ---
interface HybridSearchResult {
  supabaseGames: GameDbData[];
  igdbGames: IgdbGame[];
  totalResults: number;
}

// --- SORTING UTILITIES ---
/**
 * Sort Supabase games by release date (most recent first)
 */
const sortSupabaseGamesByDate = (a: GameDbData, b: GameDbData): number => {
  // Handle null/undefined dates - put them at the end
  if (!a.first_release_date && !b.first_release_date) return 0;
  if (!a.first_release_date) return 1;
  if (!b.first_release_date) return -1;

  // Convert string dates to timestamps and sort descending (most recent first)
  const timestampA = new Date(a.first_release_date).getTime();
  const timestampB = new Date(b.first_release_date).getTime();
  return timestampB - timestampA;
};

/**
 * Sort IGDB games by release date (most recent first)
 */
const sortIgdbGamesByDate = (a: IgdbGame, b: IgdbGame): number => {
  // Handle null/undefined dates - put them at the end
  if (!a.first_release_date && !b.first_release_date) return 0;
  if (!a.first_release_date) return 1;
  if (!b.first_release_date) return -1;

  // Sort by Unix timestamp descending (most recent first)
  return b.first_release_date - a.first_release_date;
};

// --- CUSTOM HOOK for Search Logic ---
const useSearchBar = () => {
  const [inputValue, setInputValue] = useState('');
  const [supabaseGames, setSupabaseGames] = useState<GameDbData[]>([]);
  const [igdbGames, setIgdbGames] = useState<IgdbGame[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);
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
      setSupabaseGames([]);
      setIgdbGames([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    clearTimeout(debounceTimeoutRef.current as NodeJS.Timeout);

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search/hybrid?q=${encodeURIComponent(inputValue.trim())}&limit=10`,
        );
        if (response.ok) {
          const data: HybridSearchResult = await response.json();

          // Sort and set results using optimized sorters
          setSupabaseGames(
            [...data.supabaseGames].sort(sortSupabaseGamesByDate),
          );
          setIgdbGames(
            [...data.igdbGames].sort(sortIgdbGamesByDate).slice(0, 3),
          );
        } else {
          setSupabaseGames([]);
          setIgdbGames([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSupabaseGames([]);
        setIgdbGames([]);
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

      // First, fetch the complete IGDB data (like admin page does)
      const igdbResponse = await fetch(`/api/igdb/games/${igdbGame.id}`);
      if (!igdbResponse.ok) {
        throw new Error('Failed to fetch complete IGDB data');
      }
      const fullIgdbData = await igdbResponse.json();

      // Add game to database using complete IGDB data
      const response = await fetch('/api/games/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          igdbData: fullIgdbData,
          // No banner file for search-added games
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add game to database');
      }

      await response.json();
      console.log(`✅ Successfully added game: ${igdbGame.name}`);

      // Navigate to the new game's detail page using the original slug
      router.push(`/detail/${igdbGame.slug}`);
    } catch (error) {
      console.error('Failed to add IGDB game:', error);
      // For now, just log the error - you could add toast notifications here
    } finally {
      setIsAddingGame(false);
    }
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
    supabaseGames,
    igdbGames,
    recentSearches,
    isLoading,
    isAddingGame,
    showSuggestions,
    isInputActive,
    wrapperRef,
    inputRef,
    handleSelectSuggestion,
    handleSelectIgdbGame,
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
  isAddingGame = false,
}: {
  item:
    | { text: string; tag?: string }
    | GameDbData
    | RecentSearchItem
    | IgdbGame;
  onSelect: (value: any) => void;
  isGame?: boolean;
  isAddingGame?: boolean;
}) => {
  if (isGame) {
    const game = item as GameDbData | RecentSearchItem | IgdbGame;

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

    // Handle first release date
    let releaseYear = '';
    if ('first_release_date' in game && game.first_release_date) {
      if (typeof game.first_release_date === 'string') {
        releaseYear = new Date(game.first_release_date)
          .getFullYear()
          .toString();
      } else {
        // IGDB format - Unix timestamp
        releaseYear = new Date(game.first_release_date * 1000)
          .getFullYear()
          .toString();
      }
    }

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
            <img
              src={game.cover_url}
              alt={game.name}
              className="h-10 w-8 rounded object-cover"
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
          {releaseYear && (
            <span className="text-xs text-zinc-500">{releaseYear}</span>
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
  onSelectIgdbGame,
  supabaseGames,
  igdbGames,
  recentSearches,
  onClearRecentSearches,
  isLoading,
  isAddingGame,
}: {
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
          onSelectIgdbGame={props.handleSelectIgdbGame}
          supabaseGames={props.supabaseGames}
          igdbGames={props.igdbGames}
          recentSearches={props.recentSearches}
          onClearRecentSearches={props.handleClearRecentSearches}
          isLoading={props.isLoading}
          isAddingGame={props.isAddingGame}
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
