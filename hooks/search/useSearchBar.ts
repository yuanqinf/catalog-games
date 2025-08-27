'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GameDbData, IgdbGame, HybridSearchResult } from '@/types';
import { RecentSearches, RecentSearchItem } from '@/utils/recent-searches';
import { sortSupabaseGamesByDate, sortIgdbGamesByDate } from '@/utils/sorting';
import { createGameHandlers } from './game-handlers';

export const useSearchBar = () => {
  // State
  const [inputValue, setInputValue] = useState('');
  const [supabaseGames, setSupabaseGames] = useState<GameDbData[]>([]);
  const [igdbGames, setIgdbGames] = useState<IgdbGame[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isInputActive, setIsInputActive] = useState(false);

  // Refs
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  // Game handlers
  const {
    handleSelectSuggestion,
    handleSelectIgdbGame,
    handleImmediateSearch,
  } = createGameHandlers(
    router,
    setInputValue,
    setShowSuggestions,
    setIsInputActive,
    setIsAddingGame,
  );

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setIsInputActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when active
  useEffect(() => {
    if (isInputActive) {
      inputRef.current?.focus();
    }
  }, [isInputActive]);

  // Load recent searches
  useEffect(() => {
    setRecentSearches(RecentSearches.getRecentSearches());
  }, []);

  // Reload recent searches when suggestions are shown
  useEffect(() => {
    if (showSuggestions) {
      setRecentSearches(RecentSearches.getRecentSearches());
    }
  }, [showSuggestions]);

  // Search logic with debouncing
  useEffect(() => {
    if (!inputValue.trim()) {
      setSupabaseGames([]);
      setIgdbGames([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    clearTimeout(debounceTimeoutRef.current as NodeJS.Timeout);

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search/hybrid?q=${encodeURIComponent(inputValue.trim())}&limit=10`,
        );

        if (response.ok) {
          const data: HybridSearchResult = await response.json();
          setSupabaseGames(
            [...data.supabaseGames].sort(sortSupabaseGamesByDate),
          );
          setIgdbGames(
            [...data.igdbGames].sort(sortIgdbGamesByDate).slice(0, 3),
          );
        } else {
          setSupabaseGames([]);
          setIgdbGames([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSupabaseGames([]);
        setIgdbGames([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimeoutRef.current as NodeJS.Timeout);
  }, [inputValue]);

  // Input handlers
  const handleClearRecentSearches = () => {
    RecentSearches.clearRecentSearches();
    setRecentSearches([]);
  };

  const handleClearInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleImmediateSearch(inputValue);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setIsInputActive(false);
    }
  };

  const handleActivate = () => setIsInputActive(true);
  const handleFocus = () => setShowSuggestions(true);

  return {
    // State
    inputValue,
    setInputValue,
    supabaseGames,
    igdbGames,
    recentSearches,
    isLoading,
    isAddingGame,
    showSuggestions,
    isInputActive,

    // Refs
    wrapperRef,
    inputRef,

    // Handlers
    handleSelectSuggestion,
    handleSelectIgdbGame,
    handleClearInput,
    handleInputKeyDown,
    handleActivate,
    handleFocus,
    handleClearRecentSearches,
  };
};
