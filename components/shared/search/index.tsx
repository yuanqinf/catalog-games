'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Loader2, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { Command } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useSearchBar } from '@/hooks/search/useSearchBar';
import { SearchInput } from './search-input';
import { SearchSuggestions } from './search-suggestions';
import { CreateDislikeGameModal } from '../create-dislike-game-modal';
import { toast } from 'sonner';

// Animation variants for smooth transitions
const iconVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    rotate: -90,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    rotate: 90,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};

const textVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
      delay: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};

const SearchBar = () => {
  const searchProps = useSearchBar();
  const { isInputActive, ...props } = searchProps;
  const pathname = usePathname();
  const router = useRouter();
  const isExplorePage = pathname === '/explore';
  const { user, isSignedIn } = useUser();
  const [isSubmittingDislike, setIsSubmittingDislike] = useState(false);

  const handleModalClose = () => {
    props.setShowDislikeModal(false);
  };

  const handleButtonClick = () => {
    if (isInputActive || isExplorePage) {
      // If input is active OR on explore page, perform search
      props.handleSearchClick();
    } else {
      // If input is not active and not on explore page, navigate to explore page
      router.push('/explore');
    }
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

        <Button
          onClick={handleButtonClick}
          disabled={props.isLoading}
          className="flex items-center gap-2"
        >
          {props.isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <AnimatePresence mode="wait">
              {isInputActive || isExplorePage ? (
                <motion.div
                  key="search"
                  variants={iconVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Search />
                </motion.div>
              ) : (
                <motion.div
                  key="explore"
                  variants={iconVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Gamepad2 />
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <AnimatePresence mode="wait">
            <motion.p
              key={
                isInputActive || isExplorePage ? 'search-text' : 'explore-text'
              }
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {isInputActive || isExplorePage ? 'Search' : 'Explore'}
            </motion.p>
          </AnimatePresence>
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
