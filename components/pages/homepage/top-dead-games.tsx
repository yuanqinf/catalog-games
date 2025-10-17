import Link from 'next/link';
import { Ghost } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeadGamesTableContainer } from '@/components/pages/explore-page/DeadGamesTableContainer';

const TopDeadGames = () => {
  return (
    <section className="relative mb-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-6 flex items-center justify-center gap-4">
          <Ghost className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
          <h2 className="text-2xl font-bold text-white">Game Graveyard</h2>
          <Ghost className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
        </div>
      </div>

      {/* Dead Games Table with animations */}
      <DeadGamesTableContainer
        limit={5}
        showSorting={false}
        showGameCount={false}
      />

      {/* Explore More Button */}
      <div className="mt-8 text-center">
        <Link href="/explore?view=graveyard">
          <Button
            size="lg"
            variant="outline"
            className="group border-zinc-600 bg-zinc-800/50 px-8 py-6 text-base transition-all duration-200 hover:scale-105 hover:border-zinc-500 hover:bg-zinc-700"
          >
            <span className="font-semibold text-gray-300 group-hover:text-white">
              Explore More Dead Games
            </span>
          </Button>
        </Link>
      </div>

      {/* Bottom Quote */}
      <div className="mt-16 text-center">
        <p className="mx-auto max-w-2xl text-base text-gray-400 italic sm:text-lg">
          {
            "I've always felt that 'game over' is a state of failure more for the game designer than from the player."
          }
        </p>
        <p className="mt-2 text-sm text-gray-500 italic">
          — David Cage, Detroit: Become Human
        </p>
      </div>
    </section>
  );
};

export default TopDeadGames;
