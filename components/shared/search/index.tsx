'use client';

import React, { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { Command } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useSearchBar } from '@/hooks/search/useSearchBar';
import { SearchInput } from './search-input';
import { SearchSuggestions } from './search-suggestions';
import { CreateDislikeGameModal } from '../create-dislike-game-modal';
import SortingDropdown, {
  SortOption,
  SortOrder,
} from '../header-footer/sorting-dropdown';
import { toast } from 'sonner';

const SearchBar = () => {
  const searchProps = useSearchBar();
  const { isInputActive, ...props } = searchProps;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExplorePage = pathname === '/explore';
  const { user, isSignedIn } = useUser();
  const [isSubmittingDislike, setIsSubmittingDislike] = useState(false);

  const handleModalClose = () => {
    props.setShowDislikeModal(false);
  };

  const handleDislikeConfirm = async (dislikeCount = 1) => {
    if (!isSignedIn || !user) {
      toast.error('Please sign in to dislike games');
      return;
    }

    if (!props.selectedIgdbGame) {
      toast.error('No game selected');
      return;
    }

    setIsSubmittingDislike(true);

    try {
      const response = await fetch('/api/games/pending-dislike', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          igdbGameId: props.selectedIgdbGame.id,
          initialDislikeCount: dislikeCount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific case where user already submitted dislike
        if (result.error === 'ALREADY_SUBMITTED') {
          props.setShowDislikeModal(false);
          toast.error('You have already submitted a dislike for this game');
          return;
        }
        throw new Error(result.error || 'Failed to submit dislike');
      }

      if (result.success) {
        props.setShowDislikeModal(false);
        toast.success('Dislike submitted successfully!');
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Failed to submit dislike:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit dislike',
      );
    } finally {
      setIsSubmittingDislike(false);
    }
  };

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

        {/* Dislike Modal */}
        <CreateDislikeGameModal
          isOpen={props.showDislikeModal}
          onClose={handleModalClose}
          onConfirm={handleDislikeConfirm}
          game={props.selectedIgdbGame}
          isSubmitting={isSubmittingDislike}
        />
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
              onSelectGame={props.handleSelectSuggestion}
              onSelectIgdbGame={props.handleSelectIgdbGame}
              supabaseGames={props.supabaseGames}
              igdbGames={props.igdbGames}
              isLoading={props.isLoading}
            />
          )}
        </Command>

        <Button onClick={props.handleSearchClick} disabled={props.isLoading}>
          {props.isLoading ? <Loader2 className="animate-spin" /> : <Search />}
          <p>Search</p>
        </Button>
      </div>

      {/* Dislike Modal */}
      <CreateDislikeGameModal
        isOpen={props.showDislikeModal}
        onClose={handleModalClose}
        onConfirm={handleDislikeConfirm}
        game={props.selectedIgdbGame}
        isSubmitting={isSubmittingDislike}
      />
    </div>
  );
};

export default SearchBar;
