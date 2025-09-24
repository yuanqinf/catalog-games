'use client';
import HeroGames from '@/components/pages/homepage/hero-games';
import GameGraveyard from '@/components/pages/homepage/game-graveyard';

const HomePage = () => {
  return (
    <div className="container mx-auto space-y-12 px-4 py-8">
      <HeroGames />
      <GameGraveyard />
    </div>
  );
};

export default HomePage;
