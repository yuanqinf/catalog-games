'use client';
import TopDislikeGames from '@/components/pages/homepage/top-dislike-games';
import DeadGames from '@/components/pages/homepage/dead-games';

const HomePage = () => {
  return (
    <div className="container mx-auto space-y-12 px-4 py-8">
      <TopDislikeGames />
      <DeadGames />
    </div>
  );
};

export default HomePage;
