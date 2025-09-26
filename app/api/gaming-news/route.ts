import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const rapidApiNewsKey = process.env.RAPIDAPI_KEY;

    if (!rapidApiNewsKey) {
      return NextResponse.json(
        { error: 'RapidAPI key not configured' },
        { status: 500 },
      );
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const url = `https://news-api14.p.rapidapi.com/v2/trendings?date=${today}&topic=gaming&language=en&country=us`;

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'news-api14.p.rapidapi.com',
        'x-rapidapi-key': rapidApiNewsKey,
      },
    });

    if (!response.ok) {
      throw new Error(`News API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Sort articles by date, latest first
    data.data?.sort(
      (a: any, b: any) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching gaming news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gaming news' },
      { status: 500 },
    );
  }
}
