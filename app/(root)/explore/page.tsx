'use client';

import { useState, useEffect, useMemo } from 'react';
import MiniGameCard from '@/components/shared/cards/mini-game-card';
import { GameService } from '@/lib/supabase/client';
import type { GameDbData } from '@/types';

const GameExplorePage = () => {
  const [games, setGames] = useState<GameDbData[]>([]);
  const [loading, setLoading] = useState(false);

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
    <div className="container-3xl container mx-auto p-4">
      {loading && (
        <div className="mb-6 text-center">
          <p className="text-muted-foreground">Loading games...</p>
        </div>
      )}

      <div className="mb-6">
        <p className="text-muted-foreground text-sm">
          {games.length > 0
            ? `${games.length} games from database`
            : 'No games found'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {displayGames.map((game) => (
          <MiniGameCard key={game.igdb_id} game={game} />
        ))}
      </div>
    </div>
  );
};

export default GameExplorePage;
