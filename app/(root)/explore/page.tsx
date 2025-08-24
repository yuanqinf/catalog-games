'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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

const GameExplorePage = () => {
  const [games, setGames] = useState<GameDbData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const gameService = useMemo(() => new GameService(), []);

  // TODO: Add sorting functionality (by release date, rating, name, etc.)

  // Fetch games for current page
  const fetchGamesForPage = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        console.log(`🎮 Fetching games for page ${page}...`);

        const offset = (page - 1) * GAMES_PER_PAGE;
        const pageGames = await gameService.getGamesForExplorePage(
          offset,
          GAMES_PER_PAGE,
        );

        console.log(`📊 Loaded ${pageGames.length} games for page ${page}`);
        setGames(pageGames);
      } catch (error) {
        console.error('❌ Failed to fetch games:', error);
        setGames([]);
      } finally {
        setIsLoading(false);
      }
    },
    [gameService],
  );

  // Initialize total pages count
  useEffect(() => {
    async function initializeTotalPages() {
      try {
        const totalCount = await gameService.getTotalGamesCount();
        const calculatedTotalPages = Math.ceil(totalCount / GAMES_PER_PAGE);
        setTotalPages(calculatedTotalPages);
        console.log(`📄 Total pages: ${calculatedTotalPages}`);
      } catch (error) {
        console.error('❌ Failed to get total pages:', error);
        setTotalPages(0);
      }
    }

    initializeTotalPages();
  }, [gameService]);

  // Fetch games when page changes
  useEffect(() => {
    if (totalPages > 0) {
      fetchGamesForPage(currentPage);
    }
  }, [currentPage, totalPages, fetchGamesForPage]);

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
      {/* Games grid */}
      {isLoading ? (
        <GamesGridSpinner />
      ) : (
        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3 xl:grid-cols-5 xl:p-12">
          {games.map((game) => (
            <MiniGameCard key={game.igdb_id} game={game} />
          ))}
        </div>
      )}

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
