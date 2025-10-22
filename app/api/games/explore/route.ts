import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '15');
    const numberOfGames = parseInt(searchParams.get('numberOfGames') || '100');

    // Validate parameters
    if (offset < 0 || limit < 1 || limit > 100 || numberOfGames < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 },
      );
    }

    const supabase = createClerkSupabaseClient(null);

    // Return empty if requesting beyond the top numberOfGames
    if (offset >= numberOfGames) {
      return NextResponse.json(
        {
          success: true,
          data: [],
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        },
      );
    }

    // Calculate the actual range to query
    const maxOffset = Math.min(offset + limit - 1, numberOfGames - 1);

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('dislike_count', {
        ascending: false,
        nullsFirst: false,
      })
      .range(offset, maxOffset);

    if (error) {
      console.error('Error fetching games for explore page:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch games' },
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
    console.error('Failed to fetch games for explore page:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
