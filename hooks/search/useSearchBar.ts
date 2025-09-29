'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GameDbData, IgdbGame, HybridSearchResult } from '@/types';
import { RecentSearches, RecentSearchItem } from '@/utils/recent-searches';
import { sortSupabaseGamesByDate } from '@/utils/sorting';
import { createGameHandlers } from './game-handlers';

export const useSearchBar = () => {
  // State
  const [inputValue, setInputValue] = useState('');
  const [supabaseGames, setSupabaseGames] = useState<GameDbData[]>([]);
  const [igdbGames, setIgdbGames] = useState<IgdbGame[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isInputActive, setIsInputActive] = useState(false);

  // Refs
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  // Game handlers
  const { handleSelectSuggestion, handleSelectIgdbGame } = createGameHandlers(
    router,
    setInputValue,
    setShowSuggestions,
    setIsInputActive,
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

  // Manual search function for suggestions
  const performSuggestionSearch = async (query: string) => {
    if (!query.trim()) {
      setSupabaseGames([]);
      setIgdbGames([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    clearTimeout(debounceTimeoutRef.current as NodeJS.Timeout);

    try {
      const response = await fetch(
        `/api/search/hybrid?q=${encodeURIComponent(query.trim())}&limit=10`,
      );

      if (response.ok) {
        const data: HybridSearchResult = await response.json();
        setSupabaseGames([...data.supabaseGames].sort(sortSupabaseGamesByDate));
        setIgdbGames([...data.igdbGames]);
        // Show results panel after search completes
        setShowSuggestions(true);
      } else {
        setSupabaseGames([]);
        setIgdbGames([]);
        // Show panel even with no results (will display "No results found")
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSupabaseGames([]);
      setIgdbGames([]);
      // Show panel on search failure (will display error info)
      setShowSuggestions(true);
    } finally {
      setIsLoading(false);
    }
  };

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
      performSuggestionSearch(inputValue);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setIsInputActive(false);
    }
  };

  const handleSearchClick = () => {
    if (inputValue.trim()) {
      performSuggestionSearch(inputValue);
    } else {
      // If no input, activate the search bar
      setIsInputActive(true);
    }
  };

  const handleActivate = () => setIsInputActive(true);
  const handleFocus = () => {
    // If there's input but no current results, clear and show recent searches
    // If there's input and current results, keep showing results
    if (!inputValue.trim()) {
      // No input - show recent searches
      setSupabaseGames([]);
      setIgdbGames([]);
      setIsLoading(false);
      setShowSuggestions(true);
    } else {
      // Has input - show suggestions panel with current results
      setShowSuggestions(true);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    // When user changes input, clear current results and hide suggestions
    if (value.trim() !== inputValue.trim()) {
      setSupabaseGames([]);
      setIgdbGames([]);
      setShowSuggestions(false);
    }
  };

  return {
    // State
    inputValue,
    setInputValue: handleInputChange,
    supabaseGames,
    igdbGames,
    recentSearches,
    isLoading,
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
    handleSearchClick,
  };
};
