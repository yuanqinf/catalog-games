'use client';
import React, { createContext, useContext, ReactNode } from 'react';
import { useSession } from '@clerk/nextjs';
import { GameService } from '@/lib/supabase/client';
import { useMemo } from 'react';

// Shared types
export interface GameResult {
  name: string;
  igdbId: number;
  existsInDb: boolean;
  isInSteam?: boolean;
  igdbData?: Record<string, unknown>;
  error?: string;
  selected?: boolean;
  bannerFile?: File | null;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface HeroGameResult {
  name: string;
  igdbId: number;
  existsInDb: boolean;
  existsInHeroGames: boolean;
  isInSteam?: boolean;
  igdbData?: Record<string, unknown>;
  error?: string;
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

export interface BatchReport {
  total: number;
  successful: number;
  failed: number;
  details: Array<{
    name: string;
    status: 'success' | 'failed';
    message: string;
  }>;
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

export const validateGameNames = (names: string): string[] => {
  return names
    .split('\n')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
};

// Shared processing logic
export const searchAndProcessGameById = async (
  gameService: GameService,
  igdbId: number,
  options: {
    checkHeroGames?: boolean;
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

  // Check hero games if requested
  let existsInHeroGames = false;
  if (options.checkHeroGames && existingGame) {
    const existingHeroGame = await gameService.checkHeroGameExists(
      existingGame.id,
    );
    existsInHeroGames = !!existingHeroGame;
  }

  // Check upcoming games if requested
  let existsInUpcomingGames = false;
  if (options.checkUpcomingGames && existingGame) {
    const existingUpcomingGame = await gameService.checkUpcomingGameExists(
      existingGame.id,
    );
    existsInUpcomingGames = !!existingUpcomingGame;
  }

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
    existsInHeroGames,
    existsInUpcomingGames,
    isInSteam,
    igdbData,
  };
};
