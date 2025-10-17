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

/**
 * Checks if the authenticated user is an admin
 * Returns error object if authentication fails, user not found, or not admin
 */
export async function getAuthenticatedAdmin() {
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
    .select('id, role')
    .eq('clerk_id', userId)
    .single();

  if (userError || !userData) {
    return {
      error: 'User not found',
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
    userId,
    internalUserId: userData.id,
    supabase,
  };
}
