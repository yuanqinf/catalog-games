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

    const { searchParams } = new URL(request.url);
    const criteria = searchParams.get('criteria');

    if (!criteria) {
      return NextResponse.json(
        { error: 'Missing criteria parameter' },
        { status: 400 },
      );
    }

    const encodedCriteria = encodeURIComponent(criteria);
    const url = `https://opencritic-api.p.rapidapi.com/game/search?criteria=${encodedCriteria}`;

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'opencritic-api.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
      next: { revalidate: 3600 }, // 1 hour cache
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
      criteria: criteria,
      total: Array.isArray(data) ? data.length : 0,
    });
  } catch (error) {
    console.error('Error searching OpenCritic games:', error);
    return NextResponse.json(
      {
        error: 'Failed to search games',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
