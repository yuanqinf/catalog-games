import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';
import { currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { isAdmin: false, error: 'Not authenticated' },
        { status: 401 },
      );
    }

    const supabase = createClerkSupabaseClient(null);

    // Get user role from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', clerkUser.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return NextResponse.json(
        { isAdmin: false, error: 'Failed to fetch user role' },
        { status: 500 },
      );
    }

    const isAdmin = userData?.role === 'admin';

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { isAdmin: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
