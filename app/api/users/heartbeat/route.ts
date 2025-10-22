import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const supabase = createClerkSupabaseClient(null);

    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Failed to parse heartbeat request body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 },
      );
    }

    const { clerk_id, session_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: 'session_id is required' },
        { status: 400 },
      );
    }

    // Update the users table for authenticated users
    if (clerk_id) {
      await supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('clerk_id', clerk_id);
    }

    // Upsert active session for both authenticated and anonymous users
    const { error } = await supabase.rpc('upsert_active_session', {
      p_session_id: session_id,
      p_clerk_id: clerk_id || null,
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
