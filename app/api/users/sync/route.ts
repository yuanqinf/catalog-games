import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';
import { currentUser } from '@clerk/nextjs/server';

export async function POST() {
  try {
    // Get the current user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Unauthorized - No user found' },
        { status: 401 },
      );
    }

    const supabase = createClerkSupabaseClient(null); // Server-side usage without session

    // Extract user data from Clerk
    const userData = {
      clerk_id: clerkUser.id,
      username: clerkUser.username || clerkUser.firstName || 'Unknown',
      avatar_url: clerkUser.imageUrl || null,
      email: clerkUser.emailAddresses[0]?.emailAddress || null,
    };

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('clerk_id')
      .eq('clerk_id', userData.clerk_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('Error checking for existing user:', fetchError);
      return NextResponse.json(
        { error: 'Database error while checking user' },
        { status: 500 },
      );
    }

    if (existingUser) {
      // User exists, update their information
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: userData.username,
          avatar_url: userData.avatar_url,
          email: userData.email,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', userData.clerk_id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { message: 'User updated successfully', userData },
        { status: 200 },
      );
    } else {
      // User doesn't exist, create new record
      const { error: insertError } = await supabase.from('users').insert([
        {
          ...userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.error('Error creating user:', insertError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { message: 'User created successfully', userData },
        { status: 201 },
      );
    }
  } catch (error) {
    console.error('Unexpected error in user sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
