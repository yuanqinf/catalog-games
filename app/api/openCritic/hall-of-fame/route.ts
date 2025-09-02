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

    // Use current year dynamically
    const currentYear = new Date().getFullYear();
    const url = `https://opencritic-api.p.rapidapi.com/game/hall-of-fame/${currentYear}`;

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
      year: currentYear,
      total: Array.isArray(data) ? data.length : 0,
    });
  } catch (error) {
    console.error('Error fetching hall of fame games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hall of fame games' },
      { status: 500 },
    );
  }
}
