import { NextRequest, NextResponse } from 'next/server';
import { cacheHeaders } from '@/lib/api/cache-headers';
// eslint-disable-next-line @typescript-eslint/no-require-imports
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

async function fetchTrendsWithRetry(
  keyword: string,
  startDate: Date,
  endDate: Date,
  geo: string,
  maxRetries = 2,
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add delay between retries (exponential backoff)
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.log(`Retry attempt ${attempt} for keyword: ${keyword}`);
      }

      const results = await googleTrends.interestOverTime({
        keyword,
        startTime: startDate,
        endTime: endDate,
        geo,
      });

      return results;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);
    }
  }

  throw lastError || new Error('All retry attempts failed');
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

    // ✅ Default to last 7 days
    const endDate = new Date();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    console.log(
      `Fetching trends for: ${keyword}, ${startDate.toISOString()} → ${endDate.toISOString()}, geo: ${geo || 'GLOBAL'}`,
    );

    // Fetch with retry mechanism
    const results = await fetchTrendsWithRetry(
      keyword,
      startDate,
      endDate,
      geo,
    );

    const parsed = JSON.parse(results);

    if (!parsed?.default?.timelineData) {
      throw new Error('No timelineData in response');
    }

    const timeline: TrendDataPoint[] = parsed.default.timelineData.map(
      (d: { time: string; value: number[] }) => ({
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

    return NextResponse.json(response, {
      headers: cacheHeaders.custom(1800, 3600), // Cache for 30 min (Google Trends rate limits)
    });
  } catch (error) {
    console.error('Trends API error:', error);

    // Provide more specific error messages
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const isRateLimitError =
      errorMessage.includes('429') || errorMessage.includes('rate limit');
    const isTimeoutError =
      errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT');

    return NextResponse.json(
      {
        error: isRateLimitError
          ? 'Google Trends rate limit reached'
          : isTimeoutError
            ? 'Google Trends request timed out'
            : 'Failed to fetch Google Trends data',
        details: errorMessage,
      } as ErrorResponse,
      { status: 503 }, // Service Unavailable
    );
  }
}
