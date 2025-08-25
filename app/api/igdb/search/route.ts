// app/api/igdb/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { igdbClient } from '@/lib/igdb/client';
import { GameService } from '@/lib/supabase/client';

interface GameSearchResult {
  name: string;
  igdbId: number;
  existsInDb: boolean;
  igdbData?: any;
  error?: string;
}

interface MultipleSearchResponse {
  results: GameSearchResult[];
  summary: {
    total: number;
    found: number;
    existing: number;
    new: number;
    errors: number;
  };
}

// Single game search (GET)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { error: 'Missing query parameter' },
      { status: 400 },
    );
  }

  try {
    const results = await igdbClient.searchGames(query);
    return NextResponse.json(results);
  } catch (err) {
    console.error('IGDB search error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch from IGDB' },
      { status: 500 },
    );
  }
}

// Multiple games search (POST)
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Searching for multiple games on IGDB...');

    const body = await request.json();

    // Support both single query and multiple game names
    let gameNames: string[];

    if (body.query && typeof body.query === 'string') {
      // Single query mode
      gameNames = [body.query];
    } else if (body.gameNames && Array.isArray(body.gameNames)) {
      // Multiple queries mode
      gameNames = body.gameNames;
    } else {
      return NextResponse.json(
        { error: 'Either "query" string or "gameNames" array is required' },
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

        // Direct IGDB search instead of calling the GET endpoint
        const searchResults = await igdbClient.searchGames(trimmedName);

        if (!searchResults || searchResults.length === 0) {
          results.push({
            name: trimmedName,
            igdbId: 0,
            existsInDb: false,
            error: 'No results found on IGDB',
          });
          continue;
        }

        console.log('🔍 Search Data:', searchResults);

        // Filter for main games only (category === 0)
        const mainGames = searchResults.filter(
          (game: any) =>
            game.category === 0 ||
            game.category === 1 ||
            game.category === 2 ||
            game.category === 8 ||
            game.category === 9 ||
            game.category === 10,
        );

        if (mainGames.length === 0) {
          results.push({
            name: trimmedName,
            igdbId: 0,
            existsInDb: false,
            error: 'No valid games found',
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

    const response: MultipleSearchResponse = {
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
