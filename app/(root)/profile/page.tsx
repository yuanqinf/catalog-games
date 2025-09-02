'use client';
import React, { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { BookmarkCheck, MessageSquareDiff } from 'lucide-react';
import HighlightGameCard from '@/components/shared/cards/highlight-game-card';

const UserProfilePage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="container mx-auto space-y-12 px-4 py-8">
      <Card className="w-full">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-6">
            <Image
              className="rounded-full"
              src={user.imageUrl}
              alt={user.fullName ?? 'User profile picture'}
              width={100}
              height={100}
            />
            <div>
              <CardTitle className="text-3xl font-bold">
                {user.fullName}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {user.primaryEmailAddress?.emailAddress}
              </CardDescription>
            </div>
          </div>
          <blockquote className="border-primary text-muted-foreground hidden border-l-4 pl-2 italic lg:block">
            <p>
              “Games are not just toys. They can be a bridge to something more.”
            </p>
            <footer className="mt-2 text-sm font-semibold">
              Hideo Kojima (creator of Metal Gear Solid)
            </footer>
          </blockquote>
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <BookmarkCheck className="text-primary hidden h-6 w-6 sm:block" />
              <div className="flex items-baseline space-x-2">
                <p className="text-lg font-bold">6</p>
                <p className="text-muted-foreground text-sm">Saved</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MessageSquareDiff className="text-primary hidden h-6 w-6 sm:block" />
              <div className="flex items-baseline space-x-2">
                <p className="text-lg font-bold">6</p>
                <p className="text-muted-foreground text-sm">Rated</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <hr className="my-8 border-zinc-700" />

      <section>
        <h2 className="mb-6 text-2xl font-bold">My Collection</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* {mockMonthlyBestGamesData.map((game: GameData) => (
            <HighlightGameCard key={game.id} game={game} />
          ))} */}
        </div>
      </section>
    </div>
  );
};

export default UserProfilePage;
