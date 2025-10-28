import { motion } from 'framer-motion';
import MiniGameCard from '@/components/shared/cards/mini-game-card';
import type { GameDbData } from '@/types';
import { useTranslation } from '@/lib/i18n/client';

interface DislikedGamesGridProps {
  games: GameDbData[];
  currentPage: number;
  gamesPerPage: number;
  isLoading: boolean;
  loadingText: string;
  isLastPage?: boolean;
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
  isLastPage = false,
}: DislikedGamesGridProps) {
  const { t } = useTranslation();
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
    <>
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

      {/* End of List Message - Only on Last Page */}
      {isLastPage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mx-auto mb-12 max-w-2xl rounded-lg border border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8 text-center shadow-lg"
        >
          <h3 className="mb-3 text-xl font-semibold text-white">
            {t('explore_last_page_title')}
          </h3>

          <p className="mb-4 text-base text-gray-300">
            {t('explore_last_page_message')}
          </p>

          <p className="text-sm text-gray-400 italic">
            {t('explore_last_page_message_author')}
          </p>
        </motion.div>
      )}
    </>
  );
}
