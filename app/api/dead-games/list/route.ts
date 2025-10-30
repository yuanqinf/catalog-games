import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'dead_date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const supabase = createClerkSupabaseClient(null);

    const query = supabase
      .from('dead_games')
      .select(
        `
        *,
        games (
          id,
          igdb_id,
          name,
          slug,
          cover_url,
          banner_url,
          first_release_date,
          summary,
          developers,
          publishers
        )
      `,
      )
      .order(sortBy as 'dead_date' | 'user_reaction_count', {
        ascending: sortOrder === 'asc',
      });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching dead games:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch dead games' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data || [],
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (error) {
    console.error('Failed to fetch dead games:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
