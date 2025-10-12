import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    console.log('heartbeat');

    const supabase = createClerkSupabaseClient();

    console.log('heartbeat2');
    const { user_id } = await req.json();
    console.log('user_id: ', user_id);

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from('users')
      .update({ last_seen: new Date().toISOString() })
      .eq('clerk_id', user_id);

    if (error) {
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
