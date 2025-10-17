'use client';
import { ReactNode, createContext, useContext, useMemo } from 'react';
import { useSession } from '@clerk/nextjs';
import { GameService } from '@/lib/supabase/client';

// Shared types
export interface GameResult {
  name: string;
  igdbId: number;
  existsInDb: boolean;
  isInSteam?: boolean;
  igdbData?: any;
  error?: string;
  selected?: boolean;
  bannerFile?: File | null;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface UpcomingGameResult {
  name: string;
  igdbId?: number;
  existsInDb: boolean;
  existsInUpcomingGames: boolean;
  isMatched: boolean;
  isInSteam?: boolean;
  igdbData?: Record<string, unknown>;
  error?: string;
  selected?: boolean;
  highlight?: boolean;
  bannerFile?: File | null;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

// Context interface
interface AdminContextType {
  gameService: GameService;
}

// Create context
const AdminContext = createContext<AdminContextType | null>(null);

// Provider component
export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useSession();

  const gameService = useMemo(() => new GameService(session), [session]);

  return (
    <AdminContext.Provider value={{ gameService }}>
      {children}
    </AdminContext.Provider>
  );
};

// Hook to use the context
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

// Shared validation utilities
export const validateIgdbId = (id: string): boolean => {
  return id.trim() !== '' && !isNaN(Number(id));
};

// Shared processing logic
export const searchAndProcessGameById = async (
  gameService: GameService,
  igdbId: number,
  options: {
    checkUpcomingGames?: boolean;
    skipSteamCheck?: boolean;
  } = {},
) => {
  console.log(`🔍 Searching for game with ID: ${igdbId}`);

  // Fetch IGDB data
  const existsResponse = await fetch(`/api/igdb/games/${igdbId}`);
  if (!existsResponse.ok) {
    throw new Error('Game not found in IGDB');
  }

  const igdbData = await existsResponse.json();

  // Check if game exists in our games table
  const existingGame = await gameService.checkGameExists(igdbId);
  const existsInDb = !!existingGame;

  // Check Steam availability
  let isInSteam = false;
  if (!options.skipSteamCheck) {
    const { checkGameExistsInSteam } = await import(
      '@/utils/steam-integration'
    );
    isInSteam = await checkGameExistsInSteam(
      igdbData?.name || `Game ID ${igdbId}`,
    );
  }

  return {
    igdbId,
    name: igdbData?.name || `Game ID ${igdbId}`,
    existsInDb,
    isInSteam,
    igdbData,
  };
};
