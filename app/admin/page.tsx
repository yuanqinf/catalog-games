'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@clerk/nextjs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AdminProvider,
  SingleGameAdd,
  HeroGameManager,
} from '@/components/admin';

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
          <p className="text-zinc-400">
            Add individual games and manage hero games for the catalog.
          </p>
        </div>

        <Tabs defaultValue="single-add" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single-add">Single Add</TabsTrigger>
            <TabsTrigger value="hero-games">Hero Games</TabsTrigger>
          </TabsList>

          <TabsContent value="single-add" className="space-y-6">
            <SingleGameAdd />
          </TabsContent>

          <TabsContent value="hero-games" className="space-y-6">
            <HeroGameManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminProvider>
  );
}
