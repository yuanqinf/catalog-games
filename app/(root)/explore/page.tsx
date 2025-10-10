'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
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
import { GameService } from '@/lib/supabase/client';
import type { GameDbData } from '@/types';

const GAMES_PER_PAGE = 15;
const TOP_GAMES_LIMIT = 100;

// Animation variants for staggered card appearance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Stagger delay between each card
      delayChildren: 0.1, // Initial delay before first card
    },
  },
};

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
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(TOP_GAMES_LIMIT / GAMES_PER_PAGE);

  // Fetch games with SWR and polling
  const { data: games, isLoading } = useSWR<GameDbData[]>(
    ['explore-games', currentPage],
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

  // Loading spinner for games grid
  const GamesGridSpinner = () => (
    <div className="flex items-center justify-center py-20">
      <div className="text-muted-foreground flex items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span>Loading games...</span>
      </div>
    </div>
  );

  return (
    <div className="container-3xl container mx-auto p-4">
      {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="bg-clip-text text-4xl font-bold text-red-400">
          Top 100 Most Disliked Games
        </h1>
        <p className="text-md mt-2 text-zinc-400">
          The Most Controversial Titles Ranked by Player Reactions
        </p>
      </div>
      {/* Games grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GamesGridSpinner />
          </motion.div>
        ) : (
          <motion.div
            key={`games-page-${currentPage}`}
            className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3 xl:grid-cols-5 xl:p-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {games?.map((game, index) => {
              // Calculate ranking based on current page and index
              const ranking = (currentPage - 1) * GAMES_PER_PAGE + index + 1;
              return (
                <motion.div key={game.igdb_id} variants={cardVariants} layout>
                  <MiniGameCard game={game} ranking={ranking} />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
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
                    currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
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
    </div>
  );
};

export default GameExplorePage;
