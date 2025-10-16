'use client';
import TopDislikeGames from '@/components/pages/homepage/top-dislike-games';
import TopDeadGames from '@/components/pages/homepage/top-dead-games';

const HomePage = () => {
  return (
    <div className="container mx-auto space-y-12 px-4 py-8">
      <TopDislikeGames />
      <TopDeadGames />
    </div>
  );
};

export default HomePage;
