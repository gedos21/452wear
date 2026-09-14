"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence } from "motion/react";
import { SearchOverlay } from "./search-overlay";
import { useScrollLock } from "@/hooks/use-scroll-lock";

/**
 * Global arama katmanı. Kök layout'ta bir kez sarmalanır; header'daki ARAMA
 * düğmesi hangi sayfada olursa olsun aynı katmanı açar.
 *
 * Sorgu burada tutulur, böylece Quick View kapandığında kullanıcı aradığı
 * kelimeyi ve sonuçlarını kaybetmez.
 */

type SearchValue = {
  open: boolean;
  query: string;
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (next: string) => void;
};

const SearchContext = createContext<SearchValue | null>(null);

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch, SearchProvider içinde kullanılmalı.");
  return ctx;
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  useScrollLock(open);

  return (
    <SearchContext.Provider
      value={{ open, query, openSearch, closeSearch, setQuery }}
    >
      {children}
      <AnimatePresence>
        {open && (
          <SearchOverlay
            query={query}
            onQueryChange={setQuery}
            onClose={closeSearch}
          />
        )}
      </AnimatePresence>
    </SearchContext.Provider>
  );
}
