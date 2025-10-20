import { notFound } from 'next/navigation';
import { GameService } from '@/lib/supabase/client';
import GameDetail from '@/components/pages/game-detail-page/game-detail';

const GameDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const resolvedParams = await params;
  const gameService = new GameService();
  const game = await gameService.getGameBySlugId(resolvedParams.id);

  if (!game) {
    notFound();
  }

  // Check if this game is in the dead games list
  const allDeadGames = await gameService.getDeadGames();
  const deadGame = allDeadGames?.find(
    (dg) =>
      (dg.games as any).id === game.id || (dg.games as any).slug === game.slug,
  );

  return (
    <GameDetail game={game} deadGame={deadGame ? (deadGame as any) : null} />
  );
};

export default GameDetailPage;
