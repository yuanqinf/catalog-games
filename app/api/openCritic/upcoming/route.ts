import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (!rapidApiKey) {
      return NextResponse.json(
        { error: 'RapidAPI key not configured' },
        { status: 500 },
      );
    }

    const url = 'https://opencritic-api.p.rapidapi.com/game/upcoming';

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'opencritic-api.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
      next: { revalidate: 21600 }, // 6 hours
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
      total: Array.isArray(data) ? data.length : 0,
    });
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming games' },
      { status: 500 },
    );
  }
}
