import { NextRequest, NextResponse } from 'next/server';
import { vgchartzClient } from '@/lib/vgchartz/client';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json(
      { error: 'Missing slug parameter' },
      { status: 400 },
    );
  }

  if (slug.length < 2 || slug.length > 100) {
    return NextResponse.json({ error: 'Invalid slug length' }, { status: 400 });
  }

  try {
    const result = await vgchartzClient.getGameBySlug(slug);

    if (!result) {
      return NextResponse.json(
        {
          error: 'VGChartz game not found',
          slug,
          suggestion: 'Check the game name or try a different search term',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('VGChartz error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('HTTP 429')) {
      return NextResponse.json(
        { error: 'Rate limited. Please try again later.' },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch VGChartz data',
        message:
          process.env.NODE_ENV === 'development'
            ? errorMessage
            : 'Something went wrong',
      },
      { status: 500 },
    );
  }
}
