import { useState, useEffect } from 'react';
import { fetchSalesData, type SalesData } from '@/lib/sales/get-sales-data';
import {
  fetchSteamSalesDataFromSteamSpy,
  type SteamSpyData,
} from '@/lib/steam/steamspy';
import {
  getPlaytrackerData,
  type PlaytimeData,
} from '@/lib/playernet/get-playernet-data';

interface GameStatsInput {
  slug?: string;
  name: string;
  steam_app_id?: number | null;
}

export function useGameStats(game: GameStatsInput) {
  const [salesData, setSalesData] = useState<SalesData>({
    value: null,
    source: null,
  });
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const [twitchLiveViewers, setTwitchLiveViewers] = useState<number | null>(
    null,
  );
  const [isLoadingTwitch, setIsLoadingTwitch] = useState(true);
  const [steamCurrentPlayers, setSteamCurrentPlayers] = useState<number | null>(
    null,
  );
  const [isLoadingSteamPlayers, setIsLoadingSteamPlayers] = useState(true);
  const [steamSpyData, setSteamSpyData] = useState<SteamSpyData | null>(null);
  const [isLoadingSteamSpy, setIsLoadingSteamSpy] = useState(true);
  const [playtrackerData, setPlaytrackerData] = useState<PlaytimeData | null>(
    null,
  );
  const [isLoadingPlaytracker, setIsLoadingPlaytracker] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let salesTimeoutId: NodeJS.Timeout | null = null;
    let twitchController: AbortController | null = null;
    let twitchTimeoutId: NodeJS.Timeout | null = null;
    let steamController: AbortController | null = null;
    let steamTimeoutId: NodeJS.Timeout | null = null;

    const loadSalesData = async () => {
      setIsLoadingSales(true);
      try {
        const timeoutPromise = new Promise((_, reject) => {
          salesTimeoutId = setTimeout(
            () => reject(new Error('Sales data request timeout')),
            8000,
          );
        });
        const data = await Promise.race([
          fetchSalesData(game.slug, game.name),
          timeoutPromise,
        ]);
        if (isMounted) {
          setSalesData(data as SalesData);
        }
      } catch (error) {
        if (error instanceof Error && !error.message.includes('timeout')) {
          console.error('Failed to fetch sales data:', error);
        }
        if (isMounted) {
          setSalesData({ value: null, source: null });
        }
      } finally {
        if (salesTimeoutId) clearTimeout(salesTimeoutId);
        if (isMounted) {
          setIsLoadingSales(false);
        }
      }
    };

    const loadTwitchData = async () => {
      if (!game.name) return;
      setIsLoadingTwitch(true);
      try {
        twitchController = new AbortController();
        twitchTimeoutId = setTimeout(() => twitchController?.abort(), 5000);

        const response = await fetch(
          `/api/twitch?name=${encodeURIComponent(game.name)}`,
          { signal: twitchController.signal },
        );
        if (twitchTimeoutId) clearTimeout(twitchTimeoutId);

        if (response.ok && isMounted) {
          const result = await response.json();
          setTwitchLiveViewers(result.data?.liveViewers || null);
        }
      } catch (error) {
        if (isMounted && (error as Error).name !== 'AbortError') {
          console.error('Failed to fetch Twitch data:', error);
          setTwitchLiveViewers(null);
        }
      } finally {
        if (twitchTimeoutId) clearTimeout(twitchTimeoutId);
        if (isMounted) {
          setIsLoadingTwitch(false);
        }
      }
    };

    const loadSteamCurrentPlayers = async () => {
      if (!game.steam_app_id) {
        setIsLoadingSteamPlayers(false);
        return;
      }
      setIsLoadingSteamPlayers(true);
      try {
        steamController = new AbortController();
        steamTimeoutId = setTimeout(() => steamController?.abort(), 3000);

        const response = await fetch(
          `/api/steam/current-players?appId=${game.steam_app_id}`,
          { signal: steamController.signal },
        );
        if (steamTimeoutId) clearTimeout(steamTimeoutId);

        if (response.ok && isMounted) {
          const result = await response.json();
          setSteamCurrentPlayers(result.playerCount || null);
        } else if (isMounted) {
          setSteamCurrentPlayers(null);
        }
      } catch (error) {
        if (isMounted && (error as Error).name !== 'AbortError') {
          console.error('Failed to fetch Steam current players:', error);
          setSteamCurrentPlayers(null);
        }
      } finally {
        if (steamTimeoutId) clearTimeout(steamTimeoutId);
        if (isMounted) {
          setIsLoadingSteamPlayers(false);
        }
      }
    };

    const loadSteamSpyData = async () => {
      if (!game.name) return;
      setIsLoadingSteamSpy(true);
      try {
        const data = await fetchSteamSalesDataFromSteamSpy(game.name);
        if (isMounted) {
          setSteamSpyData(data);
        }
      } catch (error) {
        console.error('Failed to fetch Steam Spy data:', error);
        if (isMounted) {
          setSteamSpyData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSteamSpy(false);
        }
      }
    };

    const loadPlaytrackerData = async () => {
      if (!game.name) return;
      setIsLoadingPlaytracker(true);
      try {
        const data = await getPlaytrackerData(game.name);
        if (isMounted) {
          setPlaytrackerData(data);
        }
      } catch (error) {
        console.error('Failed to fetch Playtracker data:', error);
        if (isMounted) {
          setPlaytrackerData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlaytracker(false);
        }
      }
    };

    loadSalesData();
    loadTwitchData();
    loadSteamCurrentPlayers();
    loadSteamSpyData();
    loadPlaytrackerData();

    return () => {
      isMounted = false;
      if (salesTimeoutId) clearTimeout(salesTimeoutId);
      if (twitchController) twitchController.abort();
      if (twitchTimeoutId) clearTimeout(twitchTimeoutId);
      if (steamController) steamController.abort();
      if (steamTimeoutId) clearTimeout(steamTimeoutId);
    };
  }, [game.slug, game.name, game.steam_app_id]);

  return {
    salesData,
    isLoadingSales,
    twitchLiveViewers,
    isLoadingTwitch,
    steamCurrentPlayers,
    isLoadingSteamPlayers,
    steamSpyData,
    isLoadingSteamSpy,
    playtrackerData,
    isLoadingPlaytracker,
  };
}
