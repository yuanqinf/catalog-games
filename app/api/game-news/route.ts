import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = (searchParams.get('sortBy') as 'latest' | 'title') || 'latest';

    const gameService = new GameService();
    const newsData = await gameService.getGameNews(offset, limit, sortBy);

    return NextResponse.json({
      success: true,
      data: newsData,
      total: newsData?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching game news from Supabase:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch game news',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
