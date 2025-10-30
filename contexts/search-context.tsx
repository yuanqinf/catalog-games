'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  isMobileSearchActive: boolean;
  setIsMobileSearchActive: (active: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

  return (
    <SearchContext.Provider
      value={{ isMobileSearchActive, setIsMobileSearchActive }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
}
