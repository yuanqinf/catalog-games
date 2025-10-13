import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const supabase = createClerkSupabaseClient(null);

    const { user_id, session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: 'session_id is required' },
        { status: 400 },
      );
    }

    // Get user UUID from users table if authenticated
    let userUuid = null;
    if (user_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user_id)
        .single();

      userUuid = userData?.id; // This is UUID from users.id

      // Also update the users table for authenticated users
      if (userUuid) {
        await supabase
          .from('users')
          .update({ last_seen: new Date().toISOString() })
          .eq('clerk_id', user_id);
      }
    }

    // Upsert active session for both authenticated and anonymous users
    const { error } = await supabase.rpc('upsert_active_session', {
      p_session_id: session_id,
      p_user_id: userUuid, // Pass UUID (or null for anonymous)
    });

    if (error) {
      console.error('Heartbeat error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
