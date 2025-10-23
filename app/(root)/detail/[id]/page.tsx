import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ServerGameService } from '@/lib/supabase/server';
import GameDetail from '@/components/pages/game-detail-page/game-detail';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

// Generate dynamic metadata for each game
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const gameService = new ServerGameService();
  const game = await gameService.getGameBySlugId(resolvedParams.id);

  if (!game) {
    return {
      title: 'Game Not Found | DissGame',
      description: 'The requested game could not be found.',
    };
  }

  const gameName = game.name || 'Unknown Game';
  const dislikeCount = game.dislike_count || 0;
  const developer = game.developers?.[0] || 'Unknown Developer';
  const summary =
    game.summary ||
    `dislike and share your honest opinion about ${gameName}. Join the dissgame.click`;

  return {
    title: `${gameName} - Reviews & Ratings | DissGame`,
    description: `${summary.slice(0, 155)}...`,
    keywords: [
      gameName,
      developer,
      'game review',
      'game rating',
      'honest review',
      'player feedback',
      'gaming community',
    ],
    openGraph: {
      title: `${gameName} - ${dislikeCount.toLocaleString()} Dislikes`,
      description: summary.slice(0, 200),
      type: 'website',
      url: `https://dissgame.click/detail/${game.slug || game.id}`,
      images: game.banner_url
        ? [
            {
              url: game.banner_url,
              width: 1920,
              height: 1080,
              alt: `${gameName} banner`,
            },
          ]
        : game.cover_url
          ? [
              {
                url: game.cover_url,
                width: 264,
                height: 352,
                alt: `${gameName} cover`,
              },
            ]
          : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${gameName} on DissGame`,
      description: `${dislikeCount.toLocaleString()} dislikes clicked by players`,
      images: game.banner_url || game.cover_url || undefined,
    },
  };
}

const GameDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const resolvedParams = await params;
  const gameService = new ServerGameService();
  const game = await gameService.getGameBySlugId(resolvedParams.id);

  if (!game) {
    notFound();
  }

  // Check if this game is in the dead games list
  const allDeadGames = await gameService.getDeadGames();
  const deadGame = allDeadGames?.find(
    (dg: any) =>
      (dg.games as any).id === game.id || (dg.games as any).slug === game.slug,
  );

  return (
    <GameDetail game={game} deadGame={deadGame ? (deadGame as any) : null} />
  );
};

export default GameDetailPage;
