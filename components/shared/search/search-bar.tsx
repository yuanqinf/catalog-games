'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Loader2, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useSearchBar } from '@/hooks/search/useSearchBar';
import { SearchInput } from './search-input';
import { SearchSuggestions } from './search-suggestions';
import { CreateDislikeGameModal } from '../create-dislike-game-modal';
import { FeedbackDialog } from '@/components/shared/feedback-dialog';
import { useSearchContext } from '@/contexts/search-context';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/client';

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
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    rotate: 90,
    transition: {
      duration: 0.2,
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
      delay: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

const SearchBar = () => {
  const { t } = useTranslation();
  const searchProps = useSearchBar();
  const { isInputActive, ...props } = searchProps;
  const pathname = usePathname();
  const router = useRouter();
  const isExplorePage = pathname === '/explore';
  const [isSubmittingDislike, setIsSubmittingDislike] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { setIsMobileSearchActive } = useSearchContext();

  // Detect mobile viewport (< 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine if mobile search is expanded (only on mobile screens)
  const isMobileExpanded = isMobile && isInputActive && props.showSuggestions;

  // Update context when mobile search state changes
  useEffect(() => {
    setIsMobileSearchActive(isMobileExpanded);
  }, [isMobileExpanded, setIsMobileSearchActive]);

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
    if (!props.selectedIgdbGame) {
      toast.error(t('search_no_game_selected'));
      return;
    }

    if (!props.selectedIgdbGame.name) {
      console.error('Selected IGDB game:', props.selectedIgdbGame);
      toast.error(t('search_game_name_missing'));
      return;
    }

    setIsSubmittingDislike(true);

    try {
      const requestBody = {
        igdbGameId: props.selectedIgdbGame.id,
        gameName: props.selectedIgdbGame.name,
        initialDislikeCount: dislikeCount,
      };

      const response = await fetch('/api/games/add-pending-dislike', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific case where user already submitted dislike
        if (result.error === 'ALREADY_SUBMITTED') {
          props.setShowDislikeModal(false);
          toast.error(t('search_already_submitted'));
          return;
        }
        throw new Error(result.error || t('search_failed_to_submit_dislike'));
      }

      if (result.success) {
        props.setShowDislikeModal(false);
        toast.success(t('search_dislike_submitted_success'));
      } else {
        throw new Error(result.error || t('error_unknown'));
      }
    } catch (error) {
      console.error('Failed to submit dislike:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('search_failed_to_submit_dislike'),
      );
    } finally {
      setIsSubmittingDislike(false);
    }
  };

  return (
    <div
      ref={searchProps.wrapperRef}
      className={`relative mx-auto transition-all duration-300 ease-in-out ${
        isMobileExpanded ? 'w-full' : 'w-3/4'
      } max-w-xl md:w-full`}
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
            onBack={isMobileExpanded ? props.handleDeactivate : undefined}
            isActive={isInputActive}
          />

          {isInputActive && props.showSuggestions && (
            <SearchSuggestions
              onSelectGame={props.handleSelectSuggestion}
              onSelectIgdbGame={props.handleSelectIgdbGame}
              supabaseGames={props.supabaseGames}
              igdbGames={props.igdbGames}
              searchHistory={props.searchHistory}
              isLoading={props.isLoading}
              onOpenFeedback={() => setIsFeedbackOpen(true)}
              onClearHistory={props.handleClearHistory}
              hasSearchInput={props.inputValue.trim().length > 0}
              hasSearched={props.hasSearched}
            />
          )}
        </Command>

        {/* Mobile: Show button only when expanded, Desktop: Always show */}
        <AnimatePresence>
          {isMobileExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 0.8, width: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 md:hidden"
            >
              <Button
                onClick={() => {
                  props.handleSearchClick();
                }}
                disabled={props.isLoading}
                size="icon"
                className="flex shrink-0"
              >
                {props.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() => {
                  router.push('/explore');
                  props.handleDeactivate();
                }}
                disabled={props.isLoading}
                size="icon"
                className="flex shrink-0"
              >
                <Gamepad2 className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop button - always visible */}
        <Button
          onClick={handleButtonClick}
          disabled={props.isLoading}
          className="hidden items-center gap-2 md:flex"
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
              className="hidden md:block"
            >
              {isInputActive || isExplorePage
                ? t('search_button')
                : t('search_explore_button')}
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

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={isFeedbackOpen}
        onOpenChange={setIsFeedbackOpen}
        defaultReason="missing-game"
      />
    </div>
  );
};

export default SearchBar;
