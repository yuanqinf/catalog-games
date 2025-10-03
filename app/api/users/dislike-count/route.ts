import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';
import { currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated',
        },
        { status: 401 },
      );
    }

    const supabase = createClerkSupabaseClient(null);

    // Get the user's internal ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUser.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 },
      );
    }

    // Get all dislikes for this user and sum the counts
    const { data: dislikes, error: dislikesError } = await supabase
      .from('dislikes')
      .select('count')
      .eq('user_id', userData.id);

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
