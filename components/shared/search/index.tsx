'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { Command } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useSearchBar } from '@/hooks/search/useSearchBar';
import { SearchInput } from './search-input';
import { SearchSuggestions } from './search-suggestions';
import { CreateDislikeGameModal } from '../create-dislike-game-modal';
import { toast } from 'sonner';

const SearchBar = () => {
  const searchProps = useSearchBar();
  const { isInputActive, ...props } = searchProps;
  const pathname = usePathname();
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

  return (
    <div
      ref={searchProps.wrapperRef}
      className="relative mx-auto w-full max-w-xl"
    >
      <div className="flex items-center gap-2">
        <Command
          shouldFilter={false}
          className={`${isInputActive ? 'flex-1' : 'cursor-pointer'} overflow-visible`}
          onClick={!isInputActive ? props.handleActivate : undefined}
        >
          <SearchInput
            inputRef={props.inputRef}
            value={props.inputValue}
            onChange={props.setInputValue}
            onFocus={props.handleFocus}
            onKeyDown={props.handleInputKeyDown}
            onClear={props.handleClearInput}
            isActive={isInputActive}
            isLoading={props.isLoading}
          />

          {isInputActive && props.showSuggestions && (
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
