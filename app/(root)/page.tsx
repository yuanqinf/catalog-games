import type { Metadata } from 'next';
import TopDislikeGames from '@/components/pages/homepage/top-dislike-games';
import TopDeadGames from '@/components/pages/homepage/top-dead-games';
import { WelcomeDialog } from '@/components/shared/welcome-dialog';
import { ServerGameService } from '@/lib/supabase/server';
import { DeadGameFromAPI } from '@/types';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

// SEO Metadata
export const metadata: Metadata = {
  title: 'DissGame | Hall of Shame for Bad Games',
  description:
    'Join the Hall of Shame — vote, roast, and bury the worst games of all time. No corporate BS, just raw opinions from real players.',
  keywords: [
    'worst games',
    'bad games',
    'game reviews',
    'game ratings',
    'gaming community',
    'honest reviews',
    'gameover of the year',
  ],
  openGraph: {
    title: 'DissGame | Hall of Shame for Bad Games',
    description:
      'Vote on the most disliked games and explore the gaming graveyard.',
    type: 'website',
    url: 'https://dissgame.click',
    images: [
      {
        url: 'https://wbxceyfjhudwbareawkz.supabase.co/storage/v1/object/public/game-image-assets/logo/logo.png',
        width: 1024,
        height: 1024,
        alt: 'DissGame — Hall of Shame for Bad Games',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DissGame | Hall of Shame for Bad Games',
    description:
      'Vote, roast, and bury the most disliked games in the Hall of Shame.',
    images: [
      'https://wbxceyfjhudwbareawkz.supabase.co/storage/v1/object/public/game-image-assets/logo/logo.png',
    ],
  },
  alternates: {
    canonical: 'https://dissgame.click',
  },
};

const HomePage = async () => {
  // Fetch data server-side for SSR/ISR
  const gameService = new ServerGameService();
  const [topDislikedGames, deadGames] = await Promise.all([
    gameService.getTopDislikedGames(10),
    gameService.getDeadGames(),
  ]);

  return (
    <>
      <WelcomeDialog />
      <div className="container mx-auto space-y-12 px-4 py-8">
        <TopDislikeGames initialData={topDislikedGames} />
        <TopDeadGames initialData={deadGames as unknown as DeadGameFromAPI[]} />
      </div>
    </>
  );
};

export default HomePage;
