import { notFound } from 'next/navigation';
import GameDetail from '@/components/pages/game-detail-page/game-detail';
import { GameService } from '@/lib/supabase/client';
import { vgchartzClient } from '@/lib/vgchartz/client';

const GameDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const resolvedParams = await params;
  const gameService = new GameService();
  const game = await gameService.getGameBySlugId(resolvedParams.id);

  // Fetch VGChartz data using the client
  const vgchartzData = await vgchartzClient.getGameBySlug(game.slug);
  const { shippedUnits, asOfDate } = vgchartzData?.data ?? {};

  if (!game) {
    notFound();
  }

  return (
    <GameDetail
      game={game}
      shippedUnits={shippedUnits ?? null}
      asOfDate={asOfDate ?? null}
    />
  );
};

export default GameDetailPage;
