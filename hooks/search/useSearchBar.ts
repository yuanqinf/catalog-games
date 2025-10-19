'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  GameDbData,
  IgdbGame,
  HybridSearchResult,
  SearchHistoryItem,
} from '@/types';
import { createGameHandlers } from './game-handlers';
import {
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
} from '@/utils/searchHistory';

export const useSearchBar = () => {
  // State
  const [inputValue, setInputValue] = useState('');
  const [supabaseGames, setSupabaseGames] = useState<GameDbData[]>([]);
  const [igdbGames, setIgdbGames] = useState<IgdbGame[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isInputActive, setIsInputActive] = useState(false);
  const [showDislikeModal, setShowDislikeModal] = useState(false);
  const [selectedIgdbGame, setSelectedIgdbGame] = useState<IgdbGame | null>(
    null,
  );

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
    setSelectedIgdbGame,
    setShowDislikeModal,
    setSearchHistory,
    getSearchHistory,
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

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  // Focus input when active
  useEffect(() => {
    if (isInputActive) {
      inputRef.current?.focus();
    }
  }, [isInputActive]);

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
        setSupabaseGames(data.supabaseGames); // Keep original search relevance order
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
      // If no input, activate the search bar and focus input
      setIsInputActive(true);
      inputRef.current?.focus();
    }
  };

  const handleActivate = () => {
    setIsInputActive(true);
    setShowSuggestions(true);
  };

  const handleFocus = () => {
    // Show suggestions on focus (will show history if no input/results)
    setShowSuggestions(true);
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

  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  return {
    // State
    inputValue,
    setInputValue: handleInputChange,
    supabaseGames,
    igdbGames,
    searchHistory,
    isLoading,
    showSuggestions,
    isInputActive,
    showDislikeModal,
    selectedIgdbGame,
    setShowDislikeModal,

    // Refs
    wrapperRef,
    inputRef,

    // Handlers
    handleSelectSuggestion,
    handleSelectIgdbGame,
    handleClearInput,
    handleClearHistory,
    handleInputKeyDown,
    handleActivate,
    handleFocus,
    handleSearchClick,
  };
};
