import { NextRequest, NextResponse } from 'next/server';
import { findBestSteamMatch } from '@/lib/steam/find-best-steam-match';

interface SteamSpyResponse {
  appid: number;
  name: string;
  owners: string;
}

/**
 * Extract the lower bound from SteamSpy owners string
 * e.g., "100,000,000 .. 200,000,000" -> 100000000
 */
function parseOwnersLowerBound(ownersString: string): number | null {
  if (!ownersString || ownersString === '') return null;

  // Handle exact numbers
  if (!ownersString.includes('..')) {
    const num = parseInt(ownersString.replace(/,/g, ''), 10);
    return isNaN(num) ? null : num;
  }

  // Handle range format "100,000,000 .. 200,000,000"
  const lowerBound = ownersString.split('..')[0]?.trim();
  if (!lowerBound) return null;

  const num = parseInt(lowerBound.replace(/,/g, ''), 10);
  return isNaN(num) ? null : num;
}

export async function GET(req: NextRequest) {
  const gameName = req.nextUrl.searchParams.get('name');

  if (!gameName) {
    return NextResponse.json(
      { error: 'Missing game name parameter' },
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
    // First, find the Steam app ID using the existing matcher
    const steamMatch = await findBestSteamMatch(gameName);

    if (!steamMatch) {
      return NextResponse.json(
        {
          error: 'Steam game not found',
          gameName,
          suggestion: 'Check the game name or try a different search term',
        },
        { status: 404 },
      );
    }

    // Fetch data from SteamSpy using the found Steam app ID
    const steamSpyUrl = `https://steamspy.com/api.php?request=appdetails&appid=${steamMatch.steamAppId}`;
    const response = await fetch(steamSpyUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch data from SteamSpy' },
        { status: response.status },
      );
    }

    const steamSpyData: SteamSpyResponse = await response.json();

    // Check if the response contains valid data
    if (
      !steamSpyData.appid ||
      steamSpyData.appid.toString() !== steamMatch.steamAppId.toString()
    ) {
      return NextResponse.json(
        {
          error: 'SteamSpy data not found for this game',
          steamAppId: steamMatch.steamAppId,
        },
        { status: 404 },
      );
    }

    // Parse the owners data to get the lower bound
    const ownersLowerBound = parseOwnersLowerBound(steamSpyData.owners);

    return NextResponse.json({
      source: 'SteamSpy',
      steamAppId: steamSpyData.appid,
      steamName: steamSpyData.name,
      data: {
        ownersLowerBound,
      },
    });
  } catch (error) {
    console.error('Steam sales API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to fetch Steam sales data',
        message:
          process.env.NODE_ENV === 'development'
            ? errorMessage
            : 'Something went wrong',
      },
      { status: 500 },
    );
  }
}
