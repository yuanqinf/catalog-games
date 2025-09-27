'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@clerk/nextjs';
import { AdminProvider, SingleGameAdd, DeadGameAdd } from '@/components/admin';

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
      <div className="mx-auto max-w-6xl p-6 space-y-12">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Game Administration</h1>
          <p className="text-zinc-400">Manage games and dead games in the catalog.</p>
        </div>

        {/* Regular Games Section */}
        <section>
          <div className="mb-6">
            <h2 className="mb-2 text-2xl font-semibold">Add Regular Games</h2>
            <p className="text-zinc-400">Add individual games to the catalog.</p>
          </div>
          <SingleGameAdd />
        </section>

        {/* Dead Games Section */}
        <section>
          <div className="mb-6">
            <h2 className="mb-2 text-2xl font-semibold">Add Dead Games</h2>
            <p className="text-zinc-400">Add games to the Game Graveyard with their death information.</p>
          </div>
          <DeadGameAdd />
        </section>
      </div>
    </AdminProvider>
  );
}
