import Image from 'next/image';
import {
  Gamepad2,
  Ghost,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DeadGame } from '@/types';

interface DeadGamesTableProps {
  games: DeadGame[];
  reactionCounts: Record<string, number>;
  clickingButtons: Set<string>;
  onReaction: (deadGameId: string, event: React.MouseEvent) => void;
  showSorting?: boolean;
  sortByReactions?: 'none' | 'asc' | 'desc';
  sortByDate?: 'none' | 'asc' | 'desc';
  onSortByReactions?: () => void;
  onSortByDate?: () => void;
}

export const DeadGamesTable: React.FC<DeadGamesTableProps> = ({
  games,
  reactionCounts,
  clickingButtons,
  onReaction,
  showSorting = false,
  sortByReactions = 'none',
  sortByDate = 'none',
  onSortByReactions,
  onSortByDate,
}) => {
  return (
    <div className="max-w-8xl mx-auto">
      <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/50 shadow-2xl">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 px-6 py-6" />
                <TableHead className="px-6 py-6">Game</TableHead>
                <TableHead className="hidden px-6 py-6 sm:table-cell">
                  {showSorting && onSortByDate ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onSortByDate}
                      className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-gray-200"
                    >
                      Date
                      {sortByDate === 'none' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                      {sortByDate === 'desc' && (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {sortByDate === 'asc' && (
                        <ChevronUp className="h-3 w-3" />
                      )}
                    </Button>
                  ) : (
                    'Date'
                  )}
                </TableHead>
                <TableHead className="px-6 py-6">Status</TableHead>
                <TableHead className="hidden px-6 py-6 lg:table-cell">
                  Developer
                </TableHead>
                <TableHead className="hidden px-6 py-6 xl:table-cell">
                  Publisher
                </TableHead>
                <TableHead className="px-6 py-6 text-center">
                  {showSorting && onSortByReactions ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onSortByReactions}
                      className="mx-auto flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-gray-200"
                    >
                      <Ghost className="h-4 w-4" />
                      {sortByReactions === 'none' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                      {sortByReactions === 'desc' && (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {sortByReactions === 'asc' && (
                        <ChevronUp className="h-3 w-3" />
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <Ghost className="h-4 w-4" />
                    </div>
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <TableRow
                  key={game.id}
                  className="group cursor-pointer transition-all duration-300 hover:bg-zinc-800/30 hover:shadow-lg hover:shadow-zinc-900/20"
                  onClick={() => {
                    window.location.href = `/detail/${game.slug}`;
                  }}
                >
                  <TableCell className="w-20 px-6 py-6">
                    <div className="flex h-16 w-12 items-center justify-center overflow-hidden rounded-lg bg-zinc-800 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                      {game.coverUrl ? (
                        <Image
                          src={game.coverUrl}
                          alt={`${game.name} cover`}
                          width={48}
                          height={64}
                          className="h-full w-full object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                        />
                      ) : (
                        <Gamepad2 className="h-6 w-6 text-gray-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-6 font-semibold">
                    <div className="text-base text-white transition-all duration-300 group-hover:scale-105 group-hover:text-gray-100 sm:text-lg">
                      {game.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden px-6 py-6 sm:table-cell">
                    {game.deadDate}
                  </TableCell>
                  <TableCell className="px-6 py-6">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold transition-all duration-300 group-hover:scale-105 ${
                        game.status === 'Shutdown'
                          ? 'border border-red-700/50 bg-red-900/40 text-red-300 group-hover:border-red-700/70 group-hover:bg-red-900/60'
                          : 'border border-orange-700/50 bg-orange-900/40 text-orange-300 group-hover:border-orange-700/70 group-hover:bg-orange-900/60'
                      }`}
                    >
                      {game.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden px-6 py-6 lg:table-cell">
                    {game.developer}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden px-6 py-6 xl:table-cell">
                    {game.publisher}
                  </TableCell>
                  <TableCell className="px-6 py-6 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className={`group w-20 border-zinc-600 bg-zinc-800/50 transition-all duration-200 hover:scale-105 hover:border-zinc-500 hover:bg-zinc-700 ${
                        clickingButtons.has(game.id)
                          ? 'scale-95 bg-zinc-600'
                          : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onReaction(game.id, e);
                      }}
                    >
                      <Ghost className="mr-2 h-4 w-4 text-gray-400 transition-colors group-hover:text-white" />
                      <span className="font-medium text-gray-300 group-hover:text-white">
                        <NumberFlow value={reactionCounts[game.id] || 0} />
                      </span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
