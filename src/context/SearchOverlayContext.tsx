import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SearchOverlayContextType {
  isOpen: boolean;
  openSearch: (initialQuery?: string) => void;
  closeSearch: () => void;
  initialQuery?: string;
}

const SearchOverlayContext = createContext<SearchOverlayContextType | undefined>(undefined);

export function SearchOverlayProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string | undefined>(undefined);

  const openSearch = useCallback((query?: string) => {
    setInitialQuery(query);
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SearchOverlayContext.Provider value={{ isOpen, openSearch, closeSearch, initialQuery }}>
      {children}
    </SearchOverlayContext.Provider>
  );
}

export function useSearchOverlay() {
  const context = useContext(SearchOverlayContext);
  if (!context) {
    throw new Error('useSearchOverlay must be used within a SearchOverlayProvider');
  }
  return context;
}
