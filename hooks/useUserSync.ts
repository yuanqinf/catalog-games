'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export const useUserSync = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedUserId, setLastSyncedUserId] = useState<string | null>(null);

  useEffect(() => {
    const syncUser = async () => {
      // Only sync if:
      // 1. Clerk has loaded
      // 2. User is signed in
      // 3. We have a user object
      // 4. We haven't already synced this user in this session
      if (
        !isLoaded ||
        !isSignedIn ||
        !user ||
        user.id === lastSyncedUserId ||
        isSyncing
      ) {
        return;
      }

      setIsSyncing(true);

      try {
        const response = await fetch('/api/users/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setLastSyncedUserId(user.id);
        } else {
          const error = await response.json();
          console.error('❌ Failed to sync user:', error.error);
        }
      } catch (error) {
        console.error('❌ Error syncing user:', error);
      } finally {
        setIsSyncing(false);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user, lastSyncedUserId, isSyncing]);

  return {
    isSyncing,
    lastSyncedUserId,
  };
};
