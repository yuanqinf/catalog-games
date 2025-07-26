import { notFound } from 'next/navigation';
import GameDetail from '@/components/pages/game-detail-page/game-detail';
import { GameService } from '@/lib/supabase/client';

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

  return <GameDetail game={game} />;
};

export default GameDetailPage;
