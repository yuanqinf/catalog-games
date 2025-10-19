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
import { useTranslation } from '@/lib/i18n/client';

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
  const { t } = useTranslation();

  return (
    <div className="max-w-8xl mx-auto">
      {/* Desktop Table View (lg and up) */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/50 shadow-2xl lg:block">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 px-2 py-3 md:w-16 md:px-3 lg:w-20 lg:px-6 lg:py-6" />
                <TableHead className="max-w-[180px] px-2 py-3 md:max-w-[200px] md:px-3 lg:max-w-none lg:px-6 lg:py-6">
                  {t('table_header_game')}
                </TableHead>
                <TableHead className="hidden w-[100px] px-2 py-3 md:px-3 lg:table-cell lg:w-auto lg:px-6 lg:py-6">
                  {showSorting && onSortByDate ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onSortByDate}
                      className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-gray-200"
                    >
                      {t('table_header_date')}
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
                    t('table_header_date')
                  )}
                </TableHead>
                <TableHead className="hidden w-[110px] px-2 py-3 md:px-3 lg:table-cell lg:w-auto lg:px-6 lg:py-6">
                  {t('table_header_status')}
                </TableHead>
                <TableHead className="hidden px-2 py-3 md:px-3 lg:px-6 lg:py-6 xl:table-cell">
                  {t('table_header_developer')}
                </TableHead>
                <TableHead className="hidden px-2 py-3 md:px-3 lg:px-6 lg:py-6 2xl:table-cell">
                  {t('table_header_publisher')}
                </TableHead>
                <TableHead className="w-[90px] px-2 py-3 text-center md:w-[100px] md:px-3 lg:w-auto lg:px-6 lg:py-6">
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
                  <TableCell className="w-12 px-2 py-2 md:w-16 md:px-3 md:py-3 lg:w-20 lg:px-6 lg:py-6">
                    <div className="flex h-12 w-8 items-center justify-center overflow-hidden rounded bg-zinc-800 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl md:h-14 md:w-10 md:rounded-lg lg:h-16 lg:w-12">
                      {game.coverUrl ? (
                        <Image
                          src={game.coverUrl}
                          alt={`${game.name} cover`}
                          width={48}
                          height={64}
                          className="h-full w-full object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                        />
                      ) : (
                        <Gamepad2 className="h-4 w-4 text-gray-500 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[180px] px-2 py-2 font-semibold md:max-w-[200px] md:px-3 md:py-3 lg:max-w-none lg:px-6 lg:py-6">
                    <div className="line-clamp-2 text-xs text-white transition-all duration-300 group-hover:text-gray-100 md:text-sm lg:line-clamp-none lg:text-base">
                      {game.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden w-[100px] px-2 py-2 text-xs md:px-3 md:py-3 lg:table-cell lg:w-auto lg:px-6 lg:py-6 lg:text-sm">
                    {game.deadDate}
                  </TableCell>
                  <TableCell className="hidden w-[110px] px-2 py-2 md:px-3 md:py-3 lg:table-cell lg:w-auto lg:px-6 lg:py-6">
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-all duration-300 group-hover:scale-105 md:px-2 md:text-xs lg:px-3 lg:py-1 lg:text-sm ${
                        game.status === 'Shutdown'
                          ? 'border border-red-700/50 bg-red-900/40 text-red-300 group-hover:border-red-700/70 group-hover:bg-red-900/60'
                          : 'border border-orange-700/50 bg-orange-900/40 text-orange-300 group-hover:border-orange-700/70 group-hover:bg-orange-900/60'
                      }`}
                    >
                      {game.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden px-2 py-2 text-xs md:px-3 md:py-3 lg:px-6 lg:py-6 lg:text-sm xl:table-cell">
                    {game.developer}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden px-2 py-2 text-xs md:px-3 md:py-3 lg:px-6 lg:py-6 lg:text-sm 2xl:table-cell">
                    {game.publisher}
                  </TableCell>
                  <TableCell className="w-[90px] px-2 py-2 text-center md:w-[100px] md:px-3 md:py-3 lg:w-auto lg:px-6 lg:py-6">
                    <Button
                      size="sm"
                      variant="outline"
                      className={`group h-8 w-16 border-zinc-600 bg-zinc-800/50 px-1 transition-all duration-200 hover:scale-105 hover:border-zinc-500 hover:bg-zinc-700 md:h-9 md:w-18 md:px-2 lg:h-10 lg:w-20 lg:px-3 ${
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
                      <Ghost className="mr-0.5 h-3 w-3 text-gray-400 transition-colors group-hover:text-white md:mr-1 lg:mr-2 lg:h-4 lg:w-4" />
                      <span className="text-[10px] font-medium text-gray-300 group-hover:text-white md:text-xs lg:text-sm">
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

      {/* Mobile Card View (below lg) */}
      <div className="flex flex-col gap-3 lg:hidden">
        {games.map((game) => (
          <div
            key={game.id}
            className="group cursor-pointer overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/50 shadow-lg transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-800/50 hover:shadow-2xl"
            onClick={() => {
              window.location.href = `/detail/${game.slug}`;
            }}
          >
            <div className="flex gap-3 p-4">
              {/* Cover Image */}
              <div className="flex-shrink-0">
                <div className="flex h-20 w-14 items-center justify-center overflow-hidden rounded-lg bg-zinc-800 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                  {game.coverUrl ? (
                    <Image
                      src={game.coverUrl}
                      alt={`${game.name} cover`}
                      width={56}
                      height={80}
                      className="h-full w-full object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                    />
                  ) : (
                    <Gamepad2 className="h-6 w-6 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Game Info */}
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="line-clamp-2 text-base font-semibold text-white transition-colors duration-300 group-hover:text-gray-100">
                    {game.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span>{game.deadDate}</span>
                    <span className="text-zinc-600">•</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        game.status === 'Shutdown'
                          ? 'border border-red-700/50 bg-red-900/40 text-red-300'
                          : 'border border-orange-700/50 bg-orange-900/40 text-orange-300'
                      }`}
                    >
                      {game.status}
                    </span>
                  </div>
                  {game.developer && (
                    <p className="line-clamp-1 text-xs text-gray-500">
                      {game.developer}
                    </p>
                  )}
                </div>
              </div>

              {/* Ghost Button */}
              <div className="mt-2 flex items-center justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className={`group w-20 border-zinc-600 bg-zinc-800/50 transition-all duration-200 hover:scale-105 hover:border-zinc-500 hover:bg-zinc-700 ${
                    clickingButtons.has(game.id) ? 'scale-95 bg-zinc-600' : ''
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onReaction(game.id, e);
                  }}
                >
                  <Ghost className="mr-1 h-3 w-3 text-gray-400 transition-colors group-hover:text-white" />
                  <span className="text-xs font-medium text-gray-300 group-hover:text-white">
                    <NumberFlow value={reactionCounts[game.id] || 0} />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
