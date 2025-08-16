import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/supabase/client';

interface GameSearchResult {
  name: string;
  igdbId: number;
  existsInDb: boolean;
  igdbData?: any;
  error?: string;
}

interface SearchResponse {
  results: GameSearchResult[];
  summary: {
    total: number;
    found: number;
    existing: number;
    new: number;
    errors: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Searching for multiple games on IGDB...');

    const { gameNames } = await request.json();

    if (!gameNames || !Array.isArray(gameNames)) {
      return NextResponse.json(
        { error: 'Game names array is required' },
        { status: 400 },
      );
    }

    console.log(`🔍 Searching for ${gameNames.length} games on IGDB...`);

    const gameService = new GameService();
    const results: GameSearchResult[] = [];

    // Process each game name
    for (const gameName of gameNames) {
      const trimmedName = gameName.trim();
      if (!trimmedName) continue;

      try {
        console.log(`🎮 Searching for: ${trimmedName}`);

        // Search IGDB for the game
        const searchResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/igdb/search?query=${encodeURIComponent(trimmedName)}`,
        );

        if (!searchResponse.ok) {
          results.push({
            name: trimmedName,
            igdbId: 0,
            existsInDb: false,
            error: 'IGDB search failed',
          });
          continue;
        }

        const searchData = await searchResponse.json();

        if (!searchData || searchData.length === 0) {
          results.push({
            name: trimmedName,
            igdbId: 0,
            existsInDb: false,
            error: 'No results found on IGDB',
          });
          continue;
        }

        // Filter for main games only (category === 0)
        const mainGames = searchData.filter((game: any) => game.category === 0);

        if (mainGames.length === 0) {
          results.push({
            name: trimmedName,
            igdbId: 0,
            existsInDb: false,
            error: 'No main games found (only DLCs, expansions, etc.)',
          });
          continue;
        }

        // Process all main games, not just the first one
        for (const game of mainGames) {
          // Check if this game already exists in our database
          const existingGame = await gameService.checkGameExists(game.id);

          results.push({
            name: trimmedName,
            igdbId: game.id,
            existsInDb: !!existingGame,
            igdbData: game,
          });

          console.log(
            `✅ Found: ${game.name} (ID: ${game.id}) - ${existingGame ? 'Exists in DB' : 'New'}`,
          );
        }
      } catch (error) {
        console.error(`❌ Error searching for ${trimmedName}:`, error);
        results.push({
          name: trimmedName,
          igdbId: 0,
          existsInDb: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Generate summary
    const summary = {
      total: results.length,
      found: results.filter((r) => r.igdbId > 0).length,
      existing: results.filter((r) => r.existsInDb).length,
      new: results.filter((r) => r.igdbId > 0 && !r.existsInDb).length,
      errors: results.filter((r) => r.error).length,
    };

    console.log(`📊 Search Summary:`, summary);

    const response: SearchResponse = {
      results,
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Multiple game search failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to search games',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
