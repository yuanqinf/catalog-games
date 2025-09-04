import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClerkSupabaseClient();

    // Fetch upcoming games with full game details
    const { data, error } = await supabase
      .from('upcoming_games')
      .select(
        `
        id,
        highlight,
        added_at,
        first_release_date,
        status,
        games:game_id (
          id,
          igdb_id,
          name,
          slug,
          summary,
          first_release_date,
          cover_url,
          banner_url,
          screenshots,
          developers,
          publishers,
          genres,
          platforms
        )
      `,
      )
      .eq('status', 'upcoming')
      .order('added_at', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Failed to fetch upcoming games');
    }

    // Transform the data to match the expected format
    const transformedData =
      data?.map((upcomingGame: any) => ({
        id: upcomingGame.games.id,
        igdb_id: upcomingGame.games.igdb_id,
        name: upcomingGame.games.name,
        slug: upcomingGame.games.slug,
        summary: upcomingGame.games.summary,
        first_release_date: upcomingGame.games.first_release_date,
        cover_url: upcomingGame.games.cover_url,
        banner_url: upcomingGame.games.banner_url,
        screenshots: upcomingGame.games.screenshots,
        developers: upcomingGame.games.developers,
        publishers: upcomingGame.games.publishers,
        genres: upcomingGame.games.genres,
        platforms: upcomingGame.games.platforms,
        highlight: upcomingGame.highlight,
        added_at: upcomingGame.added_at,
        status: upcomingGame.status,
      })) || [];

    // Optimized sorting: highlighted → upcoming releases → recently added
    const sortedData = transformedData.sort((a, b) => {
      // 1. Highlighted games always come first
      if (a.highlight !== b.highlight) {
        return a.highlight ? -1 : 1;
      }

      // 2. Sort by release date priority
      const aDate = a.first_release_date
        ? new Date(a.first_release_date).getTime()
        : null;
      const bDate = b.first_release_date
        ? new Date(b.first_release_date).getTime()
        : null;
      const now = Date.now();

      // Helper function to calculate priority
      const getDatePriority = (date: number | null) => {
        if (!date) return 3; // No date = lowest priority
        return date > now ? 1 : 2; // Future = high priority, Past = medium priority
      };

      const aPriority = getDatePriority(aDate);
      const bPriority = getDatePriority(bDate);

      // Sort by priority first
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Within same priority, sort by actual date
      if (aPriority === 1 && bPriority === 1) {
        // Both future: earliest first (most imminent)
        return aDate! - bDate!;
      } else if (aPriority === 2 && bPriority === 2) {
        // Both past: latest first (most recent)
        return bDate! - aDate!;
      }

      // 3. Fallback: sort by added_at (newest first)
      return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
    });

    return NextResponse.json({
      success: true,
      data: sortedData,
      total: sortedData.length,
    });
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch upcoming games',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
