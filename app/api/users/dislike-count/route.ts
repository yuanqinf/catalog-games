import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';

export async function GET() {
  try {
    const authResult = await getAuthenticatedUser();

    if ('error' in authResult) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: authResult.status },
      );
    }

    const { internalUserId, supabase } = authResult;

    // Get all dislikes for this user and sum the counts
    const { data: dislikes, error: dislikesError } = await supabase
      .from('dislikes')
      .select('count')
      .eq('user_id', internalUserId);

    if (dislikesError) {
      throw new Error(dislikesError.message || 'Failed to fetch dislikes');
    }

    // Calculate total dislike count
    const totalDislikes =
      dislikes?.reduce((sum, dislike) => sum + (dislike.count || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalDislikes,
      },
    });
  } catch (error) {
    console.error('Failed to get user dislike count:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
