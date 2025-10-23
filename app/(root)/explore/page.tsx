import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ServerGameService } from '@/lib/supabase/server';
import { ExplorePageContent } from '@/components/pages/explore-game/explore-page-content';
import { Loader2 } from 'lucide-react';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

// SEO Metadata
export const metadata: Metadata = {
  title: 'Explore Games - Top Disliked Games & Graveyard | DissGame',
  description:
    'Browse the top 100 most disliked games and explore the gaming graveyard of shutdown and abandoned titles. Real player reactions, no corporate bias.',
  keywords: [
    'worst games',
    'most disliked games',
    'game graveyard',
    'dead games',
    'shutdown games',
    'abandoned games',
    'game reviews',
    'gaming community',
    'top 100 most disliked games',
  ],
  openGraph: {
    title: 'Explore Games - Top Disliked & Graveyard | DissGame',
    description:
      'Browse the top 100 most disliked games and explore the gaming graveyard. Real player reactions.',
    type: 'website',
    url: 'https://dissgame.click/explore',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Games - Top Disliked & Graveyard',
    description: 'Browse most disliked games and the gaming graveyard.',
  },
};

const GAMES_PER_PAGE = 15;

interface ExplorePageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function GameExplorePage({
  searchParams,
}: ExplorePageProps) {
  const params = await searchParams;
  const view = params.view || 'disliked';

  // Fetch initial data server-side for SSR/ISR
  const gameService = new ServerGameService();

  let initialDislikedGames = undefined;
  let initialDeadGames = undefined;

  if (view === 'disliked') {
    // Fetch first page of disliked games (offset 0, limit 15)
    initialDislikedGames = await gameService.getGamesForExplorePage(
      0,
      GAMES_PER_PAGE,
      100,
    );
  } else if (view === 'graveyard') {
    // Fetch dead games
    initialDeadGames = await gameService.getDeadGames();
  }

  return (
    <Suspense fallback={<ExplorePageLoading />}>
      <ExplorePageContent
        initialDislikedGames={initialDislikedGames as any}
        initialDeadGames={initialDeadGames}
      />
    </Suspense>
  );
}

function ExplorePageLoading() {
  return (
    <div className="container-3xl container mx-auto flex min-h-[60vh] items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
        <p className="text-gray-400">Loading explore page...</p>
      </div>
    </div>
  );
}
