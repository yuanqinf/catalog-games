'use client';
import { Loader2 } from 'lucide-react';
import { useSession } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminProvider, SingleGameAdd, DeadGameAdd } from '@/components/admin';

export default function AdminPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isLoaded || !isSignedIn) {
        setIsCheckingAdmin(false);
        return;
      }

      try {
        const response = await fetch('/api/users/check-admin');
        const data = await response.json();

        setIsAdmin(data.isAdmin);

        if (!data.isAdmin) {
          router.replace('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        router.replace('/');
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [isLoaded, isSignedIn, router]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state
  if (!isLoaded || isCheckingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-red-400" />
        </div>
      </div>
    );
  }

  // Don't render if not signed in or not admin
  if (!isSignedIn || !isAdmin) {
    return null;
  }

  return (
    <AdminProvider>
      <main className="mx-auto max-w-6xl space-y-12 p-6">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Game Administration</h1>
          <p className="text-gray-400">Manage games and dead games</p>
        </div>

        {/* Regular Games Section */}
        <section>
          <div className="mb-6">
            <h2 className="mb-2 text-2xl font-semibold">Add Regular Games</h2>
            <p className="text-gray-400">Add individual games</p>
          </div>
          <SingleGameAdd />
        </section>

        {/* Dead Games Section */}
        <section>
          <div className="mb-6">
            <h2 className="mb-2 text-2xl font-semibold">Add Dead Games</h2>
            <p className="text-gray-400">
              Add games to the Game Graveyard with their death information.
            </p>
          </div>
          <DeadGameAdd />
        </section>
      </main>
    </AdminProvider>
  );
}
