import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (!rapidApiKey) {
      return NextResponse.json(
        { error: 'RapidAPI key not configured' },
        { status: 500 },
      );
    }

    const { gameId } = params;
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters with defaults
    const skip = parseInt(searchParams.get('skip') || '0');
    const sort = searchParams.get('sort') || 'popularity';
    
    // Validate gameId
    if (!gameId || isNaN(parseInt(gameId))) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 },
      );
    }

    const url = `https://opencritic-api.p.rapidapi.com/reviews/game/${gameId}?skip=${skip}&sort=${sort}`;

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'opencritic-api.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
      next: { revalidate: 1800 }, // 30 minutes cache
    });

    if (!response.ok) {
      throw new Error(
        `OpenCritic API responded with status: ${response.status}`,
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data,
      gameId: parseInt(gameId),
      pagination: {
        skip: skip,
        sort: sort,
      },
      total: Array.isArray(data) ? data.length : 0,
    });
  } catch (error) {
    console.error('Error fetching OpenCritic reviews:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reviews',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 },
    );
  }
}
