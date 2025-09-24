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
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.jpg',
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
    name: 'Babylon\'s Fall',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg',
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
        <p className="text-gray-400 max-w-2xl mx-auto">
          A memorial to the games that couldn't survive the harsh realities of the gaming industry.
          Here lie the digital dreams that once sparked hope but ultimately met their end.
        </p>
      </div>

      {/* Graveyard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockGraveyardGames.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="bg-zinc-900/50 border-zinc-700 hover:border-zinc-600 transition-all duration-300 group relative overflow-hidden">
              {/* Tombstone Effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />

              <CardHeader className="relative">
                {/* Cover Image or Placeholder */}
                <div className="mb-4 relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800">
                  {game.coverUrl ? (
                    <Image
                      src={game.coverUrl}
                      alt={`${game.name} cover`}
                      fill
                      className="object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Gamepad2 size={48} className="text-zinc-600" />
                    </div>
                  )}

                  {/* RIP Overlay */}
                  <div className="absolute top-2 right-2 bg-black/70 rounded-full p-1">
                    <Skull className="h-4 w-4 text-gray-300" />
                  </div>
                </div>

                <CardTitle className="text-white group-hover:text-red-400 transition-colors">
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
                  <TrendingDown className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300 text-xs leading-relaxed">
                    {game.reason}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="border-t border-zinc-700/50">
                <div className="text-xs text-gray-500 w-full text-center">
                  Published by {game.publisher}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bottom Quote */}
      <div className="mt-12 text-center">
        <p className="text-gray-500 italic text-sm max-w-lg mx-auto">
          "In the end, even the mightiest games must face their final boss: reality."
        </p>
      </div>
    </section>
  );
};

export default GameGraveyard;
