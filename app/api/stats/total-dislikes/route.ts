import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createClerkSupabaseClient(null);

    // Use database aggregation to sum all dislike counts (efficient, scales well)
    const { data, error: aggregateError } = await supabase
      .from('games')
      .select('dislike_count.sum()');

    if (aggregateError) {
      throw new Error(
        aggregateError.message || 'Failed to fetch total dislikes',
      );
    }

    // Extract the sum from the response
    const totalDislikes = data?.[0]?.sum ?? 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          totalDislikes,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
        },
      },
    );
  } catch (error) {
    console.error('Failed to get total dislike count:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
