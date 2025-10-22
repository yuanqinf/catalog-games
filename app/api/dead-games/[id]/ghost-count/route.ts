import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const supabase = createClerkSupabaseClient(null);

    // Fetch the dead game's ghost count (user_reaction_count)
    const { data, error } = await supabase
      .from('dead_games')
      .select('user_reaction_count')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching ghost count:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch ghost count' },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Dead game not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        ghostCount: data.user_reaction_count || 0,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
        },
      },
    );
  } catch (error) {
    console.error('Failed to fetch ghost count:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
