'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowBigLeftDash,
  ArrowBigRightDash,
  Ghost,
  ThumbsDown,
} from 'lucide-react';
import MiniGameCard from '@/components/shared/cards/mini-game-card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { GameService } from '@/lib/supabase/client';
import { DeadGamesTableContainer } from '@/components/shared/dead-games/dead-games-table-container';
import type { GameDbData } from '@/types';
import { useTranslation } from '@/lib/i18n/client';

const GAMES_PER_PAGE = 15;
const TOP_GAMES_LIMIT = 100;

// Animation variants for card appearance
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 300,
      duration: 0.5,
    },
  },
};

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

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (currentPage > 4) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 3) {
        pages.push('ellipsis');
      }

      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="container-3xl container mx-auto p-4 pt-0">
      {/* Header with view switch buttons */}
      <div className="relative mb-4">
        {/* Centered header text */}
        <div className="relative overflow-hidden rounded-2xl px-8 py-12">
          {/* Switch button - absolutely positioned inside header */}
          <Button
            variant="ghost"
            onClick={() =>
              switchView(view === 'graveyard' ? 'disliked' : 'graveyard')
            }
            className={`absolute top-4 z-20 flex items-center gap-2 ${
              view === 'graveyard'
                ? 'left-4 text-red-400 hover:bg-red-950/20 hover:text-red-300'
                : 'right-4 text-gray-400 hover:bg-zinc-800 hover:text-gray-300'
            }`}
          >
            {view === 'graveyard' ? (
              <>
                <ArrowBigLeftDash className="!h-8 !w-8" />
                <span className="text-lg font-bold">
                  {t('explore_top_disliked_games')}
                </span>
                <ThumbsDown className="!h-4 !w-4" />
              </>
            ) : (
              <>
                <Ghost className="!h-5 !w-5" />
                <span className="text-lg font-bold">
                  {t('explore_game_graveyard')}
                </span>
                <ArrowBigRightDash className="!h-8 !w-8" />
              </>
            )}
          </Button>

          {/* Background radial glow effect */}
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div
              className="absolute top-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{
                background: `
                  radial-gradient(ellipse farthest-corner at top center,
                    rgba(${view === 'graveyard' ? '156,163,175' : '255,71,87'}, 0.4) 0%,
                    rgba(0, 0, 0, 0.3) 60%,
                    transparent 90%)
                `,
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            <h1
              className={`mb-4 bg-gradient-to-r bg-clip-text text-4xl font-black text-transparent ${
                view === 'graveyard'
                  ? 'from-gray-400 to-gray-600'
                  : 'from-[#ff4757] to-[#ff8894]'
              }`}
              style={{ fontWeight: 900 }}
            >
              {view === 'graveyard'
                ? t('explore_game_graveyard')
                : t('explore_top_disliked_games')}
            </h1>
            <p className="text-lg text-gray-400">
              {view === 'graveyard'
                ? t('explore_game_graveyard_description')
                : t('explore_top_disliked_description')}
            </p>
          </div>

          {/* Bottom border accent */}
          <div
            className="absolute right-0 bottom-0 left-0 h-[3px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${
                view === 'graveyard' ? '#9ca3af' : '#ff4757'
              }, transparent)`,
            }}
          />
        </div>
      </div>

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
            {/* Disliked games view */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-muted-foreground flex items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>{t('explore_loading_games')}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3 xl:grid-cols-5 xl:p-12">
                {games?.map((game, index) => {
                  // Calculate ranking based on current page and index
                  const ranking =
                    (currentPage - 1) * GAMES_PER_PAGE + index + 1;
                  return (
                    <motion.div
                      key={game.igdb_id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      layout
                    >
                      <MiniGameCard game={game} ranking={ranking} />
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination - only in disliked view */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }}
                        className={
                          currentPage <= 1
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>

                    {generatePageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage + 1);
                        }}
                        className={
                          currentPage >= totalPages
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameExplorePage;
