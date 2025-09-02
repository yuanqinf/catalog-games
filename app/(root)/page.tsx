'use client';
import HeroGames from '@/components/pages/homepage/hero-games';
import UpcomingGames from '@/components/pages/homepage/upcoming-games';
import GameRanks from '@/components/pages/homepage/game-ranks';
import GameNews from '@/components/pages/homepage/game-news';

const HomePage = () => {
  return (
    <div className="container mx-auto space-y-12 px-4 py-8">
      <HeroGames />

      <GameNews />

      {/* <MonthlyWorstGames /> */}

      <UpcomingGames />

      <hr className="border-zinc-700" />

      <GameRanks />
    </div>
  );
};

export default HomePage;
