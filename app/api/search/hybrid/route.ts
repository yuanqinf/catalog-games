import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/supabase/client';
import { igdbClient } from '@/lib/igdb/client';
import type { GameDbData, IgdbGame } from '@/types';

// Initialize clients
const gameService = new GameService();

interface HybridSearchResult {
  supabaseGames: GameDbData[];
  igdbGames: IgdbGame[];
  totalResults: number;
}

/**
 * Check if an IGDB game is already in Supabase results
 */
function isDuplicateGame(
  igdbGame: IgdbGame,
  supabaseGames: GameDbData[],
): boolean {
  return supabaseGames.some(
    (supabaseGame) =>
      supabaseGame.igdb_id === igdbGame.id ||
      supabaseGame.name.toLowerCase() === igdbGame.name.toLowerCase(),
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 },
      );
    }

    console.log(`🔍 Hybrid search for: "${query}"`);

    // Search Supabase first (priority source)
    const supabaseGames = await gameService.searchGames(query.trim(), limit);
    console.log(`📊 Supabase results: ${supabaseGames.length}`);

    // Search IGDB if we need more results
    let igdbGames: IgdbGame[] = [];

    if (supabaseGames.length < limit) {
      try {
        const igdbResults = await igdbClient.searchGames(query.trim());
        console.log(`🎮 IGDB results: ${igdbResults.length}`);

        // Remove duplicates (Supabase takes priority)
        igdbGames = igdbResults.filter(
          (igdbGame) => !isDuplicateGame(igdbGame, supabaseGames),
        );

        // Limit IGDB results to fill remaining slots
        const remainingSlots = limit - supabaseGames.length;
        igdbGames = igdbGames.slice(0, remainingSlots);

        console.log(
          `✨ Unique IGDB results after deduplication: ${igdbGames.length}`,
        );
      } catch (igdbError) {
        console.error(
          'IGDB search failed, continuing with Supabase results only:',
          igdbError,
        );
      }
    }

    const result: HybridSearchResult = {
      supabaseGames,
      igdbGames,
      totalResults: supabaseGames.length + igdbGames.length,
    };

    console.log(`🎯 Total hybrid results: ${result.totalResults}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Hybrid search API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
