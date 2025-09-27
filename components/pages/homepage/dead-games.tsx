import React, { useState } from 'react';
import Image from 'next/image';
import { Skull, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock data for game graveyard - replace with real API data later
interface DeadGame {
  id: string;
  name: string;
  deadDate: string;
  genre: string;
  status: 'Shutdown' | 'Abandoned';
  developer: string;
  publisher: string;
  coverUrl?: string; // Optional thumbnail/cover image URL
  reactionCount: number; // Number of emoji reactions
}

const mockDeadGames: DeadGame[] = [
  {
    id: '1',
    name: 'Anthem',
    deadDate: '2026/01/12',
    genre: 'Action RPG',
    status: 'Shutdown',
    developer: 'BioWare',
    publisher: 'Electronic Arts',
    reactionCount: 234,
  },
  {
    id: '2',
    name: 'Dauntless',
    deadDate: '2025/05/29',
    genre: 'Action RPG',
    status: 'Shutdown',
    developer: 'Phoenix Labs',
    publisher: 'Phoenix Labs',
    reactionCount: 89,
  },
  {
    id: '3',
    name: 'Concord',
    deadDate: '2024/09/06',
    genre: 'Hero Shooter',
    status: 'Shutdown',
    developer: 'Firewalk Studios',
    publisher: 'Sony Interactive Entertainment',
    reactionCount: 1247,
  },
  {
    id: '4',
    name: 'Apex Legends Mobile',
    deadDate: '2023/05/01',
    genre: 'Battle Royale',
    status: 'Shutdown',
    developer: 'Respawn Entertainment',
    publisher: 'Electronic Arts',
    reactionCount: 156,
  },
  {
    id: '5',
    name: 'Rumbleverse',
    deadDate: '2023/02/28',
    genre: 'Battle Royale',
    status: 'Shutdown',
    developer: 'Iron Galaxy',
    publisher: 'Epic Games',
    reactionCount: 67,
  },
  {
    id: '6',
    name: "Babylon's Fall",
    deadDate: '2023/02/27',
    genre: 'Action RPG',
    status: 'Shutdown',
    developer: 'PlatinumGames',
    publisher: 'Square Enix',
    reactionCount: 445,
  },
  {
    id: '7',
    name: 'Heroes of the Storm',
    deadDate: '2022/07/01',
    genre: 'MOBA',
    status: 'Abandoned',
    developer: 'Blizzard Entertainment',
    publisher: 'Blizzard Entertainment',
    reactionCount: 892,
  },
  {
    id: '8',
    name: 'Artifact',
    deadDate: '2021/03/01',
    genre: 'Digital Card Game',
    status: 'Abandoned',
    developer: 'Valve Corporation',
    publisher: 'Valve Corporation',
    reactionCount: 1034,
  },
];

const DeadGames = () => {
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(
    mockDeadGames.reduce(
      (acc, game) => ({
        ...acc,
        [game.id]: game.reactionCount,
      }),
      {},
    ),
  );

  const [clickingButtons, setClickingButtons] = useState<Set<string>>(
    new Set(),
  );

  const handleReaction = (gameId: string) => {
    // Add button click animation
    setClickingButtons((prev) => new Set([...prev, gameId]));
    setTimeout(() => {
      setClickingButtons((prev) => {
        const newSet = new Set(prev);
        newSet.delete(gameId);
        return newSet;
      });
    }, 200);

    // Increment reaction count
    setReactionCounts((prev) => ({
      ...prev,
      [gameId]: prev[gameId] + 1,
    }));

    // TODO: Here you would call an API to update the backend
    // Example: await fetch('/api/dead-games/react', { method: 'POST', body: JSON.stringify({ gameId }) })
  };

  return (
    <section className="relative mb-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-6 flex items-center justify-center gap-4">
          <Skull className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Game Graveyard
          </h2>
          <Skull className="h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
        </div>
      </div>

      {/* Dead Games List */}
      <div className="max-w-8xl mx-auto">
        <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/50 shadow-2xl">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20"></TableHead>
                <TableHead>Game</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Dead Date
                </TableHead>
                <TableHead className="hidden md:table-cell">Genre</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Developer
                </TableHead>
                <TableHead className="hidden xl:table-cell">
                  Publisher
                </TableHead>
                <TableHead className="text-center">Reactions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDeadGames.map((game) => (
                <TableRow key={game.id} className="group">
                  <TableCell className="w-20">
                    <div className="flex h-16 w-12 items-center justify-center overflow-hidden rounded-lg bg-zinc-800 shadow-md">
                      {game.coverUrl ? (
                        <Image
                          src={game.coverUrl}
                          alt={`${game.name} cover`}
                          width={48}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Gamepad2 className="h-6 w-6 text-zinc-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    <div className="text-base text-white group-hover:text-zinc-100 sm:text-lg">
                      {game.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {game.deadDate}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {game.genre}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                        game.status === 'Shutdown'
                          ? 'border border-red-700/50 bg-red-900/40 text-red-300'
                          : 'border border-orange-700/50 bg-orange-900/40 text-orange-300'
                      }`}
                    >
                      {game.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden lg:table-cell">
                    {game.developer}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden xl:table-cell">
                    {game.publisher}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`transition-all duration-200 ${
                        clickingButtons.has(game.id) ? 'scale-95' : ''
                      }`}
                      onClick={() => handleReaction(game.id)}
                    >
                      <span className="mr-2 text-lg">😢</span>
                      <span className="font-medium">
                        {reactionCounts[game.id]?.toLocaleString() || 0}
                      </span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Bottom Quote */}
      <div className="mt-16 text-center">
        <p className="mx-auto max-w-2xl text-base text-gray-400 italic sm:text-lg">
          {
            "I've always felt that 'game over' is a state of failure more for the game designer than from the player."
          }
        </p>
        <p className="mt-2 text-sm text-gray-500">—— David Cage</p>
      </div>
    </section>
  );
};

export default DeadGames;
