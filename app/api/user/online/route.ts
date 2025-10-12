import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

// Consider a user online if they've been seen in the last 5 minutes
const ONLINE_THRESHOLD_MINUTES = 5;

export async function GET() {
  try {
    const supabase = createClerkSupabaseClient();

    // Calculate threshold timestamp (5 minutes ago)
    const thresholdTime = new Date();
    thresholdTime.setMinutes(
      thresholdTime.getMinutes() - ONLINE_THRESHOLD_MINUTES,
    );

    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', thresholdTime.toISOString());

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
    });
  } catch (error) {
    console.error('Online count error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
