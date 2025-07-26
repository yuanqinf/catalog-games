import { NextRequest, NextResponse } from 'next/server';
const googleTrends = require('google-trends-api');

// Types
interface TrendDataPoint {
  date: Date;
  value: number;
}

interface TrendsResponse {
  data: TrendDataPoint[];
  keyword: string;
  dateRange: {
    start: string;
    end: string;
  };
  geo: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // ✅ Required keyword param
    const keyword = searchParams.get('keyword')?.trim();
    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' } as ErrorResponse,
        { status: 400 },
      );
    }

    // Optional geo param, e.g. 'US'
    const geo = searchParams.get('geo')?.toUpperCase() || '';

    // ✅ Default to last 30 days
    const endDate = new Date();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    console.log(
      `Fetching trends for: ${keyword}, ${startDate.toISOString()} → ${endDate.toISOString()}, geo: ${geo || 'GLOBAL'}`,
    );

    const results = await googleTrends.interestOverTime({
      keyword,
      startTime: startDate,
      endTime: endDate,
      geo,
    });

    const parsed = JSON.parse(results);

    if (!parsed?.default?.timelineData) {
      throw new Error('No timelineData in response');
    }

    const timeline: TrendDataPoint[] = parsed.default.timelineData.map(
      (d: any) => ({
        date: new Date(parseInt(d.time) * 1000),
        value: d.value?.[0] ?? 0,
      }),
    );

    const response: TrendsResponse = {
      data: timeline,
      keyword,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      geo: geo || 'global',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Trends API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch Google Trends data',
        details: error instanceof Error ? error.message : 'Unknown error',
      } as ErrorResponse,
      { status: 500 },
    );
  }
}
