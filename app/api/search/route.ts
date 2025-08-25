import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || !query.trim()) {
    return NextResponse.json([]);
  }

  try {
    const gameService = new GameService();
    const results = await gameService.searchGames(query.trim());

    return NextResponse.json(results);
  } catch (error) {
    console.error('Database search error:', error);
    return NextResponse.json(
      { error: 'Failed to search games' },
      { status: 500 },
    );
  }
}
