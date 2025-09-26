// app/api/igdb/search/route.ts
import { NextResponse } from 'next/server';
import { igdbClient } from '@/lib/igdb/client';

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
