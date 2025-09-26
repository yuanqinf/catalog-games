'use client';
import TopDislikeGames from '@/components/pages/homepage/top-dislike-games';
import GameGraveyard from '@/components/pages/homepage/game-graveyard';

const HomePage = () => {
  return (
    <div className="container mx-auto space-y-12 px-4 py-8">
      <TopDislikeGames />
      <GameGraveyard />
    </div>
  );
};

export default HomePage;
