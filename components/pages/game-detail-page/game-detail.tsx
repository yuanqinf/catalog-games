'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import {
  Play,
  Gamepad2,
  Ghost,
  BriefcaseBusiness,
  Tag,
  Monitor,
  Calendar,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import GameDetailSection from '@/components/pages/game-detail-page/game-detail-section';

import GameDetailHighlight from './game-detail-highlight';

import { GameDbData } from '@/types';
import { getAvatarBorderColor } from '@/utils/steam-utils';

const GameDetail = ({ game }: { game: GameDbData }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  const avatarBorderColorClass = getAvatarBorderColor(
    game.steam_all_review ?? undefined,
  );

  const getYouTubeEmbedUrl = (id: string) => {
    if (!id) return '';
    return `https://www.youtube.com/embed/${id}`;
  };

  const mediaItems = [
    ...(game.videos?.map((v, index) => ({
      title: `${game.name} Video ${index + 1}`,
      url: getYouTubeEmbedUrl(v),
    })) || []),
  ];

  const handleVideoChange = (index: number) => {
    // Pause current video if it's playing
    if (iframeRefs.current[currentVideoIndex]) {
      const currentIframe = iframeRefs.current[currentVideoIndex];
      if (currentIframe && currentIframe.src) {
        // Remove autoplay and other parameters to pause
        const baseUrl = currentIframe.src.split('?')[0];
        currentIframe.src = baseUrl;
      }
    }

    setCurrentVideoIndex(index);
  };

  const currentMedia = mediaItems[currentVideoIndex];

  return (
    <div className="bg-background text-foreground min-h-screen w-full">
      <main className="container-3xl container mx-auto px-8">
        {/* Game Detail Main Section */}
        <section className="grid grid-cols-1 gap-16 lg:grid-cols-3">
          {/* Left Column */}
          <div className="flex flex-col gap-10 lg:col-span-2">
            {/* Video Player Section */}
            <Card className="rounded-t-none pt-0 pb-4">
              <CardContent className="space-y-6 p-0">
                {/* Main Video Player */}
                <div className="relative aspect-video w-full overflow-hidden bg-black">
                  <iframe
                    ref={(el) => {
                      iframeRefs.current[currentVideoIndex] = el;
                    }}
                    src={currentMedia.url ?? ''}
                    title={currentMedia.title}
                    allowFullScreen
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>

                {/* Thumbnail Navigation */}
                <div className="relative mx-4">
                  <Carousel className="mx-auto w-[90%]">
                    <CarouselContent>
                      {mediaItems.map((media, index) => (
                        <CarouselItem
                          key={index}
                          className="basis-1/3 px-3 md:basis-1/4 lg:basis-1/5"
                        >
                          <Button
                            onClick={() => handleVideoChange(index)}
                            variant="ghost"
                            className={`relative mx-2 mt-2 aspect-video h-auto w-full overflow-hidden rounded-md p-0 transition-all duration-200 ${
                              index === currentVideoIndex
                                ? 'ring-primary ring-2 ring-offset-1'
                                : 'hover:opacity-80'
                            }`}
                          >
                            <div className="bg-muted relative h-full w-full">
                              <Image
                                src={`https://img.youtube.com/vi/${media.url?.split('/').pop()}/mqdefault.jpg`}
                                alt={`${media.title} thumbnail`}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="rounded-full bg-black/60 p-2">
                                  <Play className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            </div>
                          </Button>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-[-32px] md:left-[-40px] lg:left-[-48px]" />
                    <CarouselNext className="right-[-32px] md:right-[-40px] lg:right-[-48px]" />
                  </Carousel>
                </div>
              </CardContent>
            </Card>
            {/* Game Information Section */}
            <div className="mb-8 space-y-6">
              {/* Title and Release Date */}
              <div className="flex items-start gap-4">
                {/* Game Avatar */}
                <div
                  className={`flex-shrink-0 rounded-full border-2 p-1 ${avatarBorderColorClass}`}
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    <Image
                      src={game.cover_url ?? ''}
                      alt={`${game.name} avatar`}
                      fill
                      sizes="64px"
                      className="rounded-full object-cover"
                    />
                  </div>
                </div>

                {/* Title and Date */}
                <div className="flex-grow">
                  <h1 className="mb-2 text-4xl font-bold">{game.name}</h1>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <p className="text-muted-foreground">
                      {game.first_release_date
                        ? (() => {
                            const releaseDate = new Date(
                              game.first_release_date,
                            );
                            const now = new Date();
                            const isFuture = releaseDate > now;
                            return isFuture
                              ? `Expected to release on ${releaseDate.toLocaleDateString()}`
                              : `Released on ${releaseDate.toLocaleDateString()}`;
                          })()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {game.summary && (
                <div>
                  <h4
                    className={`leading-relaxed ${
                      isSummaryExpanded ? '' : 'line-clamp-3'
                    }`}
                  >
                    {game.summary}
                  </h4>
                  {game.summary.length > 200 && (
                    <Button
                      onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                      variant="link"
                      className="text-muted-foreground mt-2 h-auto p-0 text-sm"
                    >
                      {isSummaryExpanded ? 'Show less' : 'Show all'}
                    </Button>
                  )}
                </div>
              )}

              {/* Game Details */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <GameDetailSection
                  title="Game Engine"
                  items={game.game_engines ?? undefined}
                  icon={Gamepad2}
                />
                <GameDetailSection
                  title="Developers"
                  items={game.developers ?? undefined}
                  icon={Ghost}
                />
                <GameDetailSection
                  title="Publishers"
                  items={game.publishers ?? undefined}
                  icon={BriefcaseBusiness}
                />
              </div>

              {/* Genres and Platforms */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <GameDetailSection
                  title="Genres"
                  items={game.genres ?? undefined}
                  icon={Tag}
                  className="mb-3"
                />
                <GameDetailSection
                  title="Platforms"
                  items={game.platforms ?? undefined}
                  icon={Monitor}
                  className="mb-3"
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <GameDetailHighlight game={game} />
        </section>

        {/* Stats & Radar Chart Section */}
        {/* <section className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 md:col-span-2">
            <Card className="flex flex-col items-center justify-center p-6">
              <Clock className="text-primary mb-2 h-10 w-10" />
              <p className="text-2xl font-bold">
                {"N/A"}
              </p>
              <p className="text-muted-foreground">Avg. Play Time</p>
            </Card>
            <Card className="flex flex-col items-center justify-center p-6">
              <Star className="mb-2 h-10 w-10 text-yellow-400" />
              <p className="text-2xl font-bold">
                {game.igdb_user_rating ?? 'N/A'}
              </p>
              <p className="text-muted-foreground">Metacritic Score</p>
            </Card>
          </div>
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Rating Analysis</CardTitle>
              </CardHeader>
              <CardContent className="flex h-48 items-center justify-center">
                <p className="text-muted-foreground text-center">
                  Radar chart placeholder.
                </p>
              </CardContent>
            </Card>
          </div>
        </section> */}

        {/* User Reviews Section */}
        {/* <section className="mb-8">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>User Reviews</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <MessageSquarePlus className="mr-2 h-4 w-4" /> Write a
                    Review
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Your Review</DialogTitle>
                  </DialogHeader>
                  <p className="text-muted-foreground py-8 text-center">
                    Review form placeholder.
                  </p>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockReviews.map((review) => (
                  <div key={review.id} className="flex gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{review.username}</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {review.comment}
                      </p>
                      <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
                        <button className="hover:text-primary flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" /> Helpful
                        </button>
                        <button className="hover:text-primary flex items-center gap-1">
                          <ThumbsDown className="h-3 w-3" /> Not Helpful
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section> */}
      </main>
    </div>
  );
};

export default GameDetail;
