'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Gamepad2 } from 'lucide-react';
import { Command } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useSearchBar } from '@/hooks/search/useSearchBar';
import { SearchInput } from './search-input';
import { SearchSuggestions } from './search-suggestions';
import SortingDropdown, {
  SortOption,
  SortOrder,
} from '../header-footer/sorting-dropdown';

const SearchSection = ({
  isInputActive,
  ...props
}: ReturnType<typeof useSearchBar>) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExplorePage = pathname === '/explore';

  const handleSortChange = (option: SortOption, order: SortOrder) => {
    const sortBy = option.toLowerCase();
    router.push(`/explore?sort=${sortBy}&order=${order}`, { scroll: false });
  };

  // Get current sort state from URL for SortingDropdown
  const currentSort = searchParams.get('sort') || 'trend';
  const currentOrder = searchParams.get('order') || 'desc';
  const currentSortOption: SortOption =
    currentSort === 'latest'
      ? 'Latest'
      : currentSort === 'rating'
        ? 'Rating'
        : 'Trend';

  if (!isInputActive) {
    return (
      <div className="flex items-center gap-2">
        <Command
          shouldFilter={false}
          className="cursor-pointer overflow-visible"
          onClick={props.handleActivate}
        >
          <SearchInput
            inputRef={props.inputRef}
            value={props.inputValue}
            onChange={props.setInputValue}
            onFocus={props.handleFocus}
            onKeyDown={props.handleInputKeyDown}
            onClear={props.handleClearInput}
            isActive={false}
            isAddingGame={props.isAddingGame}
          />
        </Command>

        {isExplorePage ? (
          <SortingDropdown
            onSortChange={handleSortChange}
            currentOption={currentSortOption}
            currentOrder={currentOrder as SortOrder}
          />
        ) : (
          <Link href="/explore">
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
      <SearchInput
        inputRef={props.inputRef}
        value={props.inputValue}
        onChange={props.setInputValue}
        onFocus={props.handleFocus}
        onKeyDown={props.handleInputKeyDown}
        onClear={props.handleClearInput}
        isActive={true}
        isAddingGame={props.isAddingGame}
      />

      {props.showSuggestions &&
        !props.isAddingGame &&
        props.inputValue.trim() && (
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
