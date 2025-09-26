import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Skull, Calendar, Users, TrendingDown, Gamepad2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

// Mock data for game graveyard - replace with real API data later
interface GraveyardGame {
  id: string;
  name: string;
  coverUrl?: string;
  shutdownDate: string;
  peakPlayers?: number;
  genre: string;
  reason: string;
  publisher: string;
}

const mockGraveyardGames: GraveyardGame[] = [
  {
    id: '1',
    name: 'Anthem',
    coverUrl:
      'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.jpg',
    shutdownDate: '2023-02-24',
    peakPlayers: 500000,
    genre: 'Action RPG',
    reason: 'Poor reception and declining player base',
    publisher: 'Electronic Arts',
  },
  {
    id: '2',
    name: 'Google Stadia',
    shutdownDate: '2023-01-18',
    peakPlayers: 750000,
    genre: 'Cloud Gaming Platform',
    reason: 'Failed to gain market traction',
    publisher: 'Google',
  },
  {
    id: '3',
    name: "Babylon's Fall",
    coverUrl:
      'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg',
    shutdownDate: '2023-02-27',
    peakPlayers: 20000,
    genre: 'Action RPG',
    reason: 'Critical and commercial failure',
    publisher: 'Square Enix',
  },
  {
    id: '4',
    name: 'Rumbleverse',
    shutdownDate: '2023-02-28',
    peakPlayers: 100000,
    genre: 'Battle Royale',
    reason: 'Insufficient player engagement',
    publisher: 'Epic Games',
  },
];

const GameGraveyard = () => {
  return (
    <section className="relative mb-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Skull className="h-8 w-8 text-gray-400" />
          <h2 className="text-3xl font-bold text-white">Game Graveyard</h2>
          <Skull className="h-8 w-8 text-gray-400" />
        </div>
        <p className="mx-auto max-w-2xl text-gray-400">
          {'death to all games'}
        </p>
      </div>

      {/* Graveyard Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {mockGraveyardGames.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="group relative overflow-hidden border-zinc-700 bg-zinc-900/50 transition-all duration-300 hover:border-zinc-600">
              {/* Tombstone Effect */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

              <CardHeader className="relative">
                {/* Cover Image or Placeholder */}
                <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-lg bg-zinc-800">
                  {game.coverUrl ? (
                    <Image
                      src={game.coverUrl}
                      alt={`${game.name} cover`}
                      fill
                      className="object-cover grayscale filter transition-all duration-300 group-hover:grayscale-0"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Gamepad2 size={48} className="text-zinc-600" />
                    </div>
                  )}

                  {/* RIP Overlay */}
                  <div className="absolute top-2 right-2 rounded-full bg-black/70 p-1">
                    <Skull className="h-4 w-4 text-gray-300" />
                  </div>
                </div>

                <CardTitle className="text-white transition-colors group-hover:text-red-400">
                  {game.name}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {game.genre}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Shutdown Date */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-red-400" />
                  <span className="text-gray-300">
                    Shutdown: {new Date(game.shutdownDate).toLocaleDateString()}
                  </span>
                </div>

                {/* Peak Players */}
                {game.peakPlayers && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className="text-gray-300">
                      Peak: {game.peakPlayers.toLocaleString()} players
                    </span>
                  </div>
                )}

                {/* Reason */}
                <div className="flex items-start gap-2 text-sm">
                  <TrendingDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400" />
                  <span className="text-xs leading-relaxed text-gray-300">
                    {game.reason}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="border-t border-zinc-700/50">
                <div className="w-full text-center text-xs text-gray-500">
                  Published by {game.publisher}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bottom Quote */}
      <div className="mt-12 text-center">
        <p className="mx-auto max-w-lg text-sm text-gray-500 italic">
          {
            'In the end, even the mightiest games must face their final boss:reality.'
          }
        </p>
      </div>
    </section>
  );
};

export default GameGraveyard;
