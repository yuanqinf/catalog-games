'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from '@clerk/nextjs';
import MiniGameCard from '@/components/shared/cards/mini-game-card';
import HighlightGameCard from '@/components/shared/cards/highlight-game-card';
import { GameService } from '@/lib/supabase/client';
import type { GameDbData } from '@/types';

const GameExplorePage = () => {
  const [selectedGame, setSelectedGame] = useState<GameDbData>();
  const [games, setGames] = useState<GameDbData[]>([]);
  const [loading, setLoading] = useState(false);
  const { isLoaded, isSignedIn, session } = useSession();

  const gameService = useMemo(() => new GameService(), []);

  // Fetch games using gameService.getAllGames
  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      try {
        console.log('🎮 Fetching games from Supabase...');
        const dbGames = await gameService.getAllGames();
        console.log(`📊 Loaded ${dbGames.length} games from database`);
        setGames(dbGames);
      } catch (error) {
        console.error('❌ Failed to fetch games:', error);
        setGames([]);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, [gameService]);

  const displayGames = games.length > 0 ? games : [];

  return (
    <div className="container mx-auto p-4">
      {loading && (
        <div className="mb-4 text-center">
          <p className="text-muted-foreground">Loading games...</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left side: Selectable items */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <p className="text-muted-foreground text-sm">
              {games.length > 0
                ? `${games.length} games from database`
                : 'No games found'}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {displayGames.map((game) => (
              <div
                key={game.igdb_id}
                onClick={() => setSelectedGame(game)}
                className="cursor-pointer"
              >
                <MiniGameCard game={game} />
              </div>
            ))}
          </div>
        </div>

        {/* Right side: Hero view */}
        <aside className="sticky top-4 hidden h-fit lg:col-span-1 lg:block">
          {selectedGame && <HighlightGameCard game={selectedGame} />}
        </aside>
      </div>
    </div>
  );
};

export default GameExplorePage;
