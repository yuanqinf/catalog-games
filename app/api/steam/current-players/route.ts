import { NextRequest, NextResponse } from 'next/server';

interface SteamCurrentPlayersResponse {
  response: {
    player_count: number;
    result: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return NextResponse.json(
        { error: 'Steam App ID is required' },
        { status: 400 },
      );
    }

    const response = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Steam player count');
    }

    const data: SteamCurrentPlayersResponse = await response.json();

    // Check if the result is successful (result: 1 means success)
    if (data.response.result !== 1) {
      return NextResponse.json(
        { error: 'Invalid Steam App ID or data not available' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      playerCount: data.response.player_count,
      appId,
    });
  } catch (error) {
    console.error('Error fetching Steam current players:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Steam player count',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
