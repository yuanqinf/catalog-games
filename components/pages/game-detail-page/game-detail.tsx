'use client';

import Image from 'next/image';
import {
  Star,
  Clock,
  MessageSquarePlus,
  ThumbsUp,
  ThumbsDown,
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

import { GameData } from '@/constants/mock-game-data';
import HighlightGameCard from '@/components/shared/cards/highlight-game-card';

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

const GameDetail = ({ game }: { game: GameData }) => {
  const formatPlayerCount = (count?: number) => {
    if (count === undefined || count === null) return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.split('v=')[1];
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const mediaItems = [
    { type: 'image', url: game.images.banner },
    ...(game.videos?.map((v) => ({ type: 'video', url: v })) || []),
  ];

  return (
    <div className="bg-background text-foreground min-h-screen w-full">
      <main className="container mx-auto px-4 py-8">
        {/* Top Section */}
        <section className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg shadow-2xl lg:col-span-2">
            <Image
              src={game.images.banner}
              alt={`${game.name} banner`}
              fill
              className="object-cover"
            />
          </div>
          <div className="lg:col-span-1">
            <HighlightGameCard game={game} />
          </div>
        </section>

        {/* Stats & Radar Chart Section */}
        <section className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 md:col-span-2">
            <Card className="flex flex-col items-center justify-center p-6">
              <Clock className="text-primary mb-2 h-10 w-10" />
              <p className="text-2xl font-bold">
                {game.average_play_time
                  ? `${game.average_play_time} hrs`
                  : 'N/A'}
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
        </section>

        {/* Media Section */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent>
              <Carousel className="w-full">
                <CarouselContent>
                  {mediaItems.map((media, index) => (
                    <CarouselItem
                      key={index}
                      className="md:basis-1/2 lg:basis-1/3"
                    >
                      <div className="bg-muted relative aspect-video overflow-hidden rounded-md">
                        {media.type === 'image' ? (
                          <Image
                            src={media.url}
                            alt={`Media ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <iframe
                            src={getYouTubeEmbedUrl(media.url)}
                            title={`Video ${index + 1}`}
                            allowFullScreen
                            className="h-full w-full"
                          ></iframe>
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="ml-14" />
                <CarouselNext className="mr-14" />
              </Carousel>
            </CardContent>
          </Card>
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
                    <Image
                      src={review.avatar}
                      alt={review.username}
                      width={40}
                      height={40}
                      className="bg-muted rounded-full"
                    />
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
              <Badge variant="outline">{game.developer}</Badge>
            </div>
            <div>
              <h3 className="text-muted-foreground mb-2 font-bold uppercase">
                Platforms
              </h3>
              <div className="flex flex-wrap gap-2">
                {game.platforms.map((p) => (
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
