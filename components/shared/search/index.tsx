'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2 } from 'lucide-react';
import { Command } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import SortingDropdown, {
  SortOption,
  SortOrder,
} from '../header-footer/sorting-dropdown';
import { useSearchBar } from '@/hooks/search/useSearchBar';
import { SearchInput } from './search-input';
import { SearchSuggestions } from './search-suggestions';

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
          <SortingDropdown onSortChange={handleSortChange} />
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

      {props.showSuggestions && !props.isAddingGame && (
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
