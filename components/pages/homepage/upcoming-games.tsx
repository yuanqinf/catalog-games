import React, { useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import PaginationDots from '@/components/shared/pagination-dots';
import MiniGameCard from '@/components/shared/cards/mini-game-card';
import { mockUpcomingGamesData } from '@/constants/mock-game-data';

const UpcomingGames = () => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">Coming Soon</h2>
      <Carousel
        setApi={(apiInstance) => {
          setCarouselApi(apiInstance);
          if (apiInstance) {
            apiInstance.on('select', () => {
              if (apiInstance) {
                setActiveIndex(apiInstance.selectedScrollSnap());
              }
            });
            // Set initial activeIndex
            setActiveIndex(apiInstance.selectedScrollSnap());
          }
        }}
        opts={{
          align: 'start',
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {mockUpcomingGamesData.map((game, i) => (
            <CarouselItem
              key={`upcoming-${i}`}
              className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <MiniGameCard game={game} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="carousel-nav-button-base left-4" />
        <CarouselNext className="carousel-nav-button-base right-4" />
      </Carousel>
      <div className="mt-4 flex items-center justify-center sm:hidden">
        <PaginationDots
          totalItems={mockUpcomingGamesData.length}
          activeIndex={activeIndex}
          carouselApi={carouselApi}
        />
      </div>
    </section>
  );
};

export default UpcomingGames;
