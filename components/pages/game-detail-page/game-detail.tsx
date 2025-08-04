'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import {
  Star,
  Clock,
  MessageSquarePlus,
  ThumbsUp,
  ThumbsDown,
  Play,
  Gamepad2,
  Ghost,
  BriefcaseBusiness,
  Tag,
  Monitor,
  Calendar,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import HighlightGameCard from '@/components/shared/cards/highlight-game-card';
import { GameDbData } from '@/types';
import { getAvatarBorderColor } from '@/utils/steam-utils';

// Mock Data for sections that need it
const mockReviews = [
  {
    id: 1,
    username: 'GamerGod99',
    avatar: '/avatars/01.png',
    rating: 5,
    comment:
      'Absolutely phenomenal! A masterpiece of storytelling and gameplay. A must-play for any fan of the genre.',
  },
  {
    id: 2,
    username: 'PixelPioneer',
    avatar: '/avatars/02.png',
    rating: 4,
    comment:
      'Solid game with a great world. Had a few minor bugs, but overall a fantastic experience that I sank 80+ hours into.',
  },
  {
    id: 3,
    username: 'CasualCritic',
    avatar: '/avatars/03.png',
    rating: 3,
    comment:
      "It was okay. The graphics are nice, but the story didn't really grab me. Good for a weekend playthrough.",
  },
];

const GameDetail = ({ game }: { game: GameDbData }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  const avatarBorderColorClass = getAvatarBorderColor(
    game.steam_all_review ?? undefined,
  );

  const formatPlayerCount = (count?: number) => {
    if (count === undefined || count === null) return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

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
      <main className="container-3xl container mx-auto px-4 py-8">
        {/* Top Section */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
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
          </div>
          <div className="lg:col-span-1">
            <HighlightGameCard game={game} />
          </div>
        </section>

        {/* Game Information Section */}
        <section className="mb-8 space-y-6">
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
                        const releaseDate = new Date(game.first_release_date);
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
            {game.game_engines && game.game_engines.length > 0 && (
              <div>
                <h4 className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                  <Gamepad2 className="h-4 w-4" />
                  Game Engine
                </h4>
                <div className="flex flex-wrap gap-2">
                  {game.game_engines.map((engine) => (
                    <Badge
                      variant="outline"
                      key={engine}
                      className="px-3 py-1 text-sm"
                    >
                      {engine}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {game.developers && game.developers.length > 0 && (
              <div>
                <h4 className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                  <Ghost className="h-4 w-4" />
                  Developers
                </h4>
                <div className="flex flex-wrap gap-2">
                  {game.developers.map((developer) => (
                    <Badge
                      variant="outline"
                      key={developer}
                      className="px-3 py-1 text-sm"
                    >
                      {developer}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {game.publishers && game.publishers.length > 0 && (
              <div>
                <h4 className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                  <BriefcaseBusiness className="h-4 w-4" />
                  Publishers
                </h4>
                <div className="flex flex-wrap gap-2">
                  {game.publishers.map((publisher) => (
                    <Badge
                      variant="outline"
                      key={publisher}
                      className="px-3 py-1 text-sm"
                    >
                      {publisher}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Genres and Platforms */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {game.genres && game.genres.length > 0 && (
              <div>
                <h4 className="text-muted-foreground mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                  <Tag className="h-4 w-4" />
                  Genres
                </h4>
                <div className="flex flex-wrap gap-2">
                  {game.genres.map((genre) => (
                    <Badge
                      variant="outline"
                      key={genre}
                      className="px-3 py-1 text-sm"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {game.platforms && game.platforms.length > 0 && (
              <div>
                <h4 className="text-muted-foreground mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                  <Monitor className="h-4 w-4" />
                  Platforms
                </h4>
                <div className="flex flex-wrap gap-2">
                  {game.platforms.map((platform) => (
                    <Badge
                      variant="outline"
                      key={platform}
                      className="px-3 py-1 text-sm"
                    >
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Stats & Radar Chart Section */}
        <section className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 md:col-span-2">
            <Card className="flex flex-col items-center justify-center p-6">
              <Clock className="text-primary mb-2 h-10 w-10" />
              {/* <p className="text-2xl font-bold">
                {game.average_play_time
                  ? `${game.average_play_time} hrs`
                  : 'N/A'}
              </p> */}
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
        </section>

        {/* User Reviews Section */}
        <section className="mb-8">
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
        </section>

        {/* Footer Info Strip */}
        <section className="mt-12 border-t pt-8">
          <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-4">
            <div>
              <h3 className="text-muted-foreground mb-2 font-bold uppercase">
                Genre
              </h3>
              <Badge>{game.genres?.join(', ')}</Badge>
            </div>
            <div>
              <h3 className="text-muted-foreground mb-2 font-bold uppercase">
                Developer
              </h3>
              <Badge variant="outline">{game.developers?.[0]}</Badge>
            </div>
            <div>
              <h3 className="text-muted-foreground mb-2 font-bold uppercase">
                Platforms
              </h3>
              <div className="flex flex-wrap gap-2">
                {game.platforms?.map((p) => (
                  <Badge key={p} variant="secondary">
                    {p.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-muted-foreground mb-2 font-bold uppercase">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {game.featured_comment_tags &&
                  game.featured_comment_tags.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default GameDetail;
