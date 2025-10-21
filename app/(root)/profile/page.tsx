'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { ThumbsDown, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import ProfileGameCard from '@/components/shared/cards/profile-game-card';
import type { GameDbData } from '@/types';
import { useTranslation } from '@/lib/i18n/client';

interface DislikedGame extends GameDbData {
  user_dislike_count: number;
}

const UserProfilePage = () => {
  const { t } = useTranslation();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [totalDislikes, setTotalDislikes] = useState<number>(0);
  const [isLoadingDislikes, setIsLoadingDislikes] = useState(true);
  const [dislikedGames, setDislikedGames] = useState<DislikedGame[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [gameEmojiCounts, setGameEmojiCounts] = useState<
    Record<number, number>
  >({});

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchUserDislikeCount();
      fetchDislikedGames();
      fetchUserEmojiReactions();
    }
  }, [isLoaded, isSignedIn]);

  const fetchUserDislikeCount = async () => {
    try {
      setIsLoadingDislikes(true);
      const response = await fetch('/api/users/dislikes?total=true');
      const result = await response.json();

      if (result.success) {
        setTotalDislikes(result.data.totalDislikes);
      }
    } catch (error) {
      console.error('Failed to fetch dislike count:', error);
    } finally {
      setIsLoadingDislikes(false);
    }
  };

  const fetchDislikedGames = async () => {
    try {
      setIsLoadingGames(true);
      const response = await fetch('/api/users/dislikes');
      const result = await response.json();

      if (result.success) {
        setDislikedGames(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch disliked games:', error);
    } finally {
      setIsLoadingGames(false);
    }
  };

  const fetchUserEmojiReactions = async () => {
    try {
      const response = await fetch('/api/users/get-emoji-reactions');
      const result = await response.json();

      if (result.success) {
        setGameEmojiCounts(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch emoji reactions:', error);
    }
  };

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="container mx-auto space-y-8 px-4 py-6 sm:space-y-12 sm:py-8">
      <Card className="w-full">
        <CardContent className="p-4 sm:p-6">
          {/* Mobile Layout (< lg) */}
          <div className="flex flex-col gap-6 lg:hidden">
            {/* User Info Row */}
            <div className="flex items-center gap-4">
              <Image
                className="rounded-full"
                src={user.imageUrl}
                alt={'User profile picture'}
                width={64}
                height={64}
              />
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-xl font-bold sm:text-2xl">
                  {user.username}
                </CardTitle>
                <CardDescription className="text-muted-foreground truncate text-sm">
                  {user.primaryEmailAddress?.emailAddress}
                </CardDescription>
              </div>
            </div>

            {/* Quote Row */}
            <blockquote className="text-muted-foreground border-l-2 border-gray-600 pl-4 italic">
              <p className="text-base leading-relaxed">{t('profile_quote')}</p>
              <footer className="mt-2 text-sm font-medium text-gray-300">
                {t('profile_quote_author')}
              </footer>
            </blockquote>

            {/* Stats Row */}
            <div className="flex items-center justify-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
              <ThumbsDown className="text-primary h-5 w-5" />
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold">
                  {isLoadingDislikes ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    totalDislikes
                  )}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t('profile_total_dislikes')}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Layout (>= lg) */}
          <div className="hidden items-center justify-between gap-6 lg:flex">
            <div className="flex items-center space-x-6">
              <Image
                className="rounded-full"
                src={user.imageUrl}
                alt={'User profile picture'}
                width={100}
                height={100}
              />
              <div>
                <CardTitle className="text-3xl font-bold">
                  {user.username}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {user.primaryEmailAddress?.emailAddress}
                </CardDescription>
              </div>
            </div>
            <blockquote className="text-muted-foreground max-w-md border-l-2 border-gray-600 pl-4 italic">
              <p className="text-base leading-relaxed">{t('profile_quote')}</p>
              <footer className="mt-3 text-sm font-medium text-gray-300">
                {t('profile_quote_author')}
              </footer>
            </blockquote>
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <ThumbsDown className="text-primary h-6 w-6" />
                <div className="flex items-baseline space-x-2">
                  <p className="text-lg font-bold">
                    {isLoadingDislikes ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      totalDislikes
                    )}
                  </p>
                  <p className="text-muted-foreground hidden text-sm xl:block">
                    {t('profile_total_dislikes')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <hr className="my-6 border-zinc-700 sm:my-8" />

      <section>
        <h2 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl">
          {t('profile_my_disliked_games')}
        </h2>
        {isLoadingGames ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : dislikedGames.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 2xl:grid-cols-4">
            {dislikedGames.map((game) => (
              <ProfileGameCard
                key={game.id}
                game={game}
                userGameDislikeCount={game.user_dislike_count}
                userGameEmojiCount={game.id ? gameEmojiCounts[game.id] || 0 : 0}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-12 text-center text-sm sm:text-base">
            {t('profile_no_disliked_games')}
          </p>
        )}
      </section>
    </div>
  );
};

export default UserProfilePage;
