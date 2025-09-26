'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@clerk/nextjs';
import { AdminProvider, SingleGameAdd } from '@/components/admin';

// TODO: Only allow admin users to access this page

export default function AdminPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useSession();

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

  if (isLoaded && !isSignedIn) {
    return null;
  }

  return (
    <AdminProvider>
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Game Administration</h1>
          <p className="text-zinc-400">Add individual games to the catalog.</p>
        </div>

        <SingleGameAdd />
      </div>
    </AdminProvider>
  );
}
