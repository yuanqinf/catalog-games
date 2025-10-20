import { motion } from 'framer-motion';
import MiniGameCard from '@/components/shared/cards/mini-game-card';
import type { GameDbData } from '@/types';

interface DislikedGamesGridProps {
  games: GameDbData[];
  currentPage: number;
  gamesPerPage: number;
  isLoading: boolean;
  loadingText: string;
}

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

export function DislikedGamesGrid({
  games,
  currentPage,
  gamesPerPage,
  isLoading,
  loadingText,
}: DislikedGamesGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>{loadingText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3 xl:grid-cols-5 xl:p-12">
      {games?.map((game, index) => {
        // Calculate ranking based on current page and index
        const ranking = (currentPage - 1) * gamesPerPage + index + 1;
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
  );
}
