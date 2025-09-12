'use client';
import HeroGames from '@/components/pages/homepage/hero-games';
import GameRanks from '@/components/pages/homepage/game-ranks';

const HomePage = () => {
  return (
    <div className="container mx-auto space-y-12 px-4 py-8">
      <HeroGames />

      {/* <MonthlyWorstGames /> */}

      <hr className="border-zinc-700" />

      <GameRanks />
    </div>
  );
};

export default HomePage;
