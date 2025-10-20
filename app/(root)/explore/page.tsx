'use client';

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GameService } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/client';
import { DeadGamesTableContainer } from '@/components/shared/dead-games/dead-games-table-container';
import { ExplorePageHeader } from '@/components/pages/explore-game/explore-page-header';
import { DislikedGamesGrid } from '@/components/pages/explore-game/disliked-games-grid';
import { PaginationControls } from '@/components/pages/explore-game/pagination-controls';

import type { GameDbData } from '@/types';

const GAMES_PER_PAGE = 15;
const TOP_GAMES_LIMIT = 100;

const GameExplorePage = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get('view') || 'disliked';
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(TOP_GAMES_LIMIT / GAMES_PER_PAGE);

  // Fetch games with SWR and polling (only for disliked view)
  const { data: games, isLoading } = useSWR<GameDbData[]>(
    view === 'disliked' ? ['explore-games', currentPage] : null,
    async ([, page]: [string, number]) => {
      const gameService = new GameService();
      const offset = (page - 1) * GAMES_PER_PAGE;
      console.log(
        `🎮 Fetching games for page ${page} (sorted by dislike count)...`,
      );
      const pageGames = await gameService.getGamesForExplorePage(
        offset,
        GAMES_PER_PAGE,
        TOP_GAMES_LIMIT,
      );
      console.log(`📊 Loaded ${pageGames.length} games for page ${page}`);
      return pageGames;
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 5000,
      dedupingInterval: 2000,
      revalidateOnReconnect: false,
    },
  );

  // Handle view switching
  const switchView = (newView: 'disliked' | 'graveyard') => {
    if (newView === 'disliked') {
      router.push('/explore');
    } else {
      router.push('/explore?view=graveyard');
    }
  };

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [currentPage, totalPages],
  );

  return (
    <div className="container-3xl container mx-auto p-4 pt-0">
      {/* Header with view switch */}
      <ExplorePageHeader
        view={view as 'disliked' | 'graveyard'}
        onViewChange={switchView}
        title={
          view === 'graveyard'
            ? t('explore_game_graveyard')
            : t('explore_top_disliked_games')
        }
        description={
          view === 'graveyard'
            ? t('explore_game_graveyard_description')
            : t('explore_top_disliked_description')
        }
        dislikedLabel={t('explore_top_disliked_games')}
        graveyardLabel={t('explore_game_graveyard')}
      />

      {/* Content area - switches based on view */}
      <AnimatePresence mode="wait">
        {view === 'graveyard' ? (
          <motion.div
            key="graveyard-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="gap-4 p-6 xl:p-12"
          >
            {/* Graveyard view */}
            <DeadGamesTableContainer showSorting showAddDeadGameRow />

            {/* Bottom Quote - only in graveyard view */}
            <div className="mt-16 text-center">
              <p className="mx-auto max-w-2xl text-base text-gray-400 italic sm:text-lg">
                {t('explore_graveyard_quote')}
              </p>
              <p className="mt-2 text-sm text-gray-500 italic">
                {t('explore_graveyard_quote_author')}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="disliked-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Disliked games grid */}
            <DislikedGamesGrid
              games={games || []}
              currentPage={currentPage}
              gamesPerPage={GAMES_PER_PAGE}
              isLoading={isLoading}
              loadingText={t('explore_loading_games')}
            />

            {/* Pagination */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameExplorePage;
