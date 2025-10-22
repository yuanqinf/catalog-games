import { currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/client';

/**
 * Checks if the authenticated user is an admin
 * Returns error object if authentication fails, user not found, or not admin
 */
export async function getAuthenticatedAdmin() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return {
      error: 'User not authenticated',
      status: 401 as const,
    };
  }

  const supabase = createClerkSupabaseClient(null);

  // Check if user has admin role in users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('clerk_id', clerkUser.id)
    .single();

  if (userError || !userData) {
    return {
      error: 'User not found in database',
      status: 404 as const,
    };
  }

  if (userData.role !== 'admin') {
    return {
      error: 'Forbidden - Admin access required',
      status: 403 as const,
    };
  }

  return {
    userId: clerkUser.id,
    clerkId: clerkUser.id,
  };
}
