'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@clerk/nextjs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminProvider } from '@/components/admin/AdminContext';
import { GameBatchSearch } from '@/components/admin/GameBatchSearch';
import { SingleGameAdd } from '@/components/admin/SingleGameAdd';
import { HeroGameManager } from '@/components/admin/HeroGameManager';
import { UpcomingGamesManager } from '@/components/admin/UpcomingGamesManager';
import { GameNewsManager } from '@/components/admin/GameNewsManager';
import { OpenCriticReviewsManager } from '@/components/admin/OpenCriticReviewsManager';

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
            Manage games, hero games, upcoming games, news, and reviews for the
            catalog.
          </p>
        </div>

        <Tabs defaultValue="batch-search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="batch-search">Batch Search</TabsTrigger>
            <TabsTrigger value="single-add">Single Add</TabsTrigger>
            <TabsTrigger value="hero-games">Hero Games</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="batch-search" className="space-y-6">
            <GameBatchSearch />
          </TabsContent>

          <TabsContent value="single-add" className="space-y-6">
            <SingleGameAdd />
          </TabsContent>

          <TabsContent value="hero-games" className="space-y-6">
            <HeroGameManager />
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <UpcomingGamesManager />
          </TabsContent>

          <TabsContent value="news" className="space-y-6">
            <GameNewsManager />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <OpenCriticReviewsManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminProvider>
  );
}
