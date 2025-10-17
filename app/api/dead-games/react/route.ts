import { NextRequest, NextResponse } from 'next/server';
import { GameService } from '@/lib/supabase/client';
import { rateLimit } from '@/lib/api/rate-limit';
import { getClientIP } from '@/lib/api/get-client-ip';
import { validateBodySize, BODY_SIZE_LIMITS } from '@/lib/api/body-size-limit';

export async function POST(request: NextRequest) {
  try {
    // Validate request body size
    const bodySizeError = validateBodySize(request, BODY_SIZE_LIMITS.STANDARD);
    if (bodySizeError) return bodySizeError;

    // Rate limiting: 100 requests per minute per IP/user
    const identifier = getClientIP(request);
    const { success, resetAt } = rateLimit(identifier, {
      interval: 60000, // 1 minute
      uniqueTokenPerInterval: 100,
    });

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetAt).toISOString(),
            'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    const body = await request.json();
    const { deadGameId, incrementBy = 1 } = body;

    if (!deadGameId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dead game ID is required',
        },
        { status: 400 },
      );
    }

    // Basic validation to prevent malicious requests
    // Allow users to click rapidly for satisfaction, but prevent negative/invalid values
    if (
      typeof incrementBy !== 'number' ||
      incrementBy < 1 ||
      !Number.isInteger(incrementBy)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid increment value. Must be a positive integer',
        },
        { status: 400 },
      );
    }

    const gameService = new GameService();
    const newReactionCount = await gameService.incrementDeadGameReaction(
      deadGameId,
      incrementBy,
    );

    return NextResponse.json({
      success: true,
      data: {
        deadGameId,
        newReactionCount,
        incrementBy,
      },
    });
  } catch (error) {
    console.error('Failed to increment dead game reaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
