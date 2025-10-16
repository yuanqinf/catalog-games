import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';
import { currentUser } from '@clerk/nextjs/server';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'Game ID is required' },
        { status: 400 },
      );
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const supabase = createClerkSupabaseClient(null);

    // Get user ID from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUser.id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { success: false, error: 'User not found in database' },
        { status: 404 },
      );
    }

    console.log('Attempting to remove rating for:', {
      userId: userData.id,
      gameId: parseInt(gameId),
    });

    // Use PostgreSQL function for atomic operation
    const { data: result, error: rpcError } = await supabase.rpc(
      'remove_user_rating',
      {
        p_user_id: userData.id,
        p_game_id: parseInt(gameId),
      },
    );

    console.log('RPC result:', { result, rpcError });

    if (rpcError) {
      console.error('Failed to remove rating via RPC:', rpcError);

      // Fallback to manual deletion if RPC function doesn't exist
      console.log('Attempting manual deletion fallback...');
      const { error: deleteError } = await supabase
        .from('game_ratings')
        .delete()
        .eq('user_id', userData.id)
        .eq('game_id', parseInt(gameId));

      if (deleteError) {
        console.error('Error removing rating:', deleteError);
        return NextResponse.json(
          { success: false, error: 'Failed to remove rating' },
          { status: 500 },
        );
      }

      console.log('Manual deletion successful');
      return NextResponse.json({
        success: true,
        message: 'Rating removed successfully (fallback)',
      });
    }

    // Check RPC result
    if (result && typeof result === 'object' && 'success' in result) {
      console.log('RPC returned success field:', result.success);
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Rating removed successfully',
          removed_count: result.removed_count,
        });
      } else {
        // RPC function returned success: false, but this is expected if no rating exists
        console.log('RPC returned success: false -', result.error);
        return NextResponse.json({
          success: false,
          error: result.error || 'No rating found to remove',
          isExpected: true,
        });
      }
    }

    console.log('RPC completed without error, assuming success');
    return NextResponse.json({
      success: true,
      message: 'Rating removed successfully',
    });
  } catch (error) {
    console.error('Failed to remove rating:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
