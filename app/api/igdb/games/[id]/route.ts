// app/api/igdb/games/[id]/route.ts
import { igdbClient } from '@/lib/igdb/client';
import { NextResponse } from 'next/server';
import { cacheHeaders } from '@/lib/api/cache-headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/');
  const idStr = parts[parts.length - 1];
  const id = parseInt(idStr, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
  }

  try {
    const game = await igdbClient.getGameById(id);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(game, { headers: cacheHeaders.external() });
  } catch (error) {
    console.error(`Error fetching game with id ${id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
