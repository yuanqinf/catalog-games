import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

/**
 * Gets the authenticated user and their internal database ID
 * Returns error object if authentication fails or user not found
 */
export async function getAuthenticatedUser() {
  const { userId } = await auth();

  if (!userId) {
    return {
      error: 'User not authenticated',
      status: 401 as const,
    };
  }

  const supabase = createClerkSupabaseClient(null);

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (userError || !userData) {
    return {
      error: 'User not found',
      status: 404 as const,
    };
  }

  return {
    userId,
    internalUserId: userData.id,
    supabase,
  };
}
