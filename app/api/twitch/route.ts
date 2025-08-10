import { NextRequest, NextResponse } from 'next/server';
import { igdbClient } from '@/lib/igdb/client';

export async function GET(req: NextRequest) {
  const gameName = req.nextUrl.searchParams.get('name');

  if (!gameName) {
    return NextResponse.json(
      { error: 'Missing name parameter. Please provide a game name.' },
      { status: 400 },
    );
  }

  if (gameName.length < 2 || gameName.length > 100) {
    return NextResponse.json(
      { error: 'Invalid game name length' },
      { status: 400 },
    );
  }

  try {
    // Get Twitch game ID by name
    const twitchGameId = await igdbClient.getTwitchGameIdByName(gameName);

    if (!twitchGameId) {
      return NextResponse.json(
        {
          error: 'Game not found on Twitch',
          gameName,
          suggestion: 'Check the game name or try a different search term',
        },
        { status: 404 },
      );
    }

    // Get total live viewers from Twitch
    const totalLiveViewers =
      await igdbClient.getGameViewersFromTwitchByGameId(twitchGameId);

    return NextResponse.json({
      source: 'Twitch Helix API',
      gameId: twitchGameId,
      gameName: gameName,
      data: {
        liveViewers: totalLiveViewers,
        totalViewers: totalLiveViewers,
      },
    });
  } catch (error) {
    console.error('Twitch API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to fetch Twitch data',
        message:
          process.env.NODE_ENV === 'development'
            ? errorMessage
            : 'Something went wrong',
      },
      { status: 500 },
    );
  }
}
