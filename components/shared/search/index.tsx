'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Command } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useSearchBar } from '@/hooks/search/useSearchBar';
import { SearchInput } from './search-input';
import { SearchSuggestions } from './search-suggestions';
import SortingDropdown, {
  SortOption,
  SortOrder,
} from '../header-footer/sorting-dropdown';

const SearchBar = () => {
  const searchProps = useSearchBar();
  const { isInputActive, ...props } = searchProps;
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
      <div
        ref={searchProps.wrapperRef}
        className="relative mx-auto w-full max-w-xl"
      >
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
              isLoading={props.isLoading}
            />
          </Command>

          {isExplorePage ? (
            <SortingDropdown
              onSortChange={handleSortChange}
              currentOption={currentSortOption}
              currentOrder={currentOrder as SortOrder}
            />
          ) : (
            <Button
              onClick={props.handleSearchClick}
              disabled={props.isLoading}
            >
              {props.isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Search />
              )}
              <p>Search</p>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={searchProps.wrapperRef}
      className="relative mx-auto w-full max-w-xl"
    >
      <div className="flex items-center gap-2">
        <Command shouldFilter={false} className="flex-1 overflow-visible">
          <SearchInput
            inputRef={props.inputRef}
            value={props.inputValue}
            onChange={props.setInputValue}
            onFocus={props.handleFocus}
            onKeyDown={props.handleInputKeyDown}
            onClear={props.handleClearInput}
            isActive={true}
            isLoading={props.isLoading}
          />

          {props.showSuggestions && (
            <SearchSuggestions
              inputValue={props.inputValue}
              onSelectGame={props.handleSelectSuggestion}
              onSelectIgdbGame={props.handleSelectIgdbGame}
              supabaseGames={props.supabaseGames}
              igdbGames={props.igdbGames}
              recentSearches={props.recentSearches}
              onClearRecentSearches={props.handleClearRecentSearches}
              isLoading={props.isLoading}
            />
          )}
        </Command>

        <Button onClick={props.handleSearchClick} disabled={props.isLoading}>
          {props.isLoading ? <Loader2 className="animate-spin" /> : <Search />}
          <p>Search</p>
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
