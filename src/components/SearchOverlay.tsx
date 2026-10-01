import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { ComicSource, ComicCard } from '../types/comic';
import { searchUnified } from '../lib/adapters';
import { getProxiedImageUrl } from '../lib/api';
import { useSearchOverlay } from '../context/SearchOverlayContext';
import {
  getSearchHistory,
  addSearchHistory,
  removeSearchHistory,
  getSavedSource,
} from '../lib/storage';

const POPULAR_GENRES = [
  'Action',
  'Romance',
  'Fantasy',
  'Isekai',
  'Comedy',
  'Martial Arts',
  'Drama',
  'Adventure',
  'Sci-Fi',
];

export function SearchOverlay() {
  const { isOpen, closeSearch, initialQuery } = useSearchOverlay();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [source, setSource] = useState<ComicSource>('mangakita');
  const [results, setResults] = useState<ComicCard[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Initialize
  useEffect(() => {
    if (isOpen) {
      setSource(getSavedSource());
      setHistory(getSearchHistory());
      setQuery(initialQuery || '');
      setResults([]);
      setPage(1);
      setTimeout(() => inputRef.current?.focus(), 60);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialQuery]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeSearch]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchUnified(source, trimmed, 1);
        setResults(data.items || []);
        setHasNext(data.hasNext);
        setPage(1);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, source, isOpen]);

  // Infinite scroll load more
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasNext || !query.trim()) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await searchUnified(source, query.trim(), nextPage);
      setResults((prev) => [...prev, ...(data.items || [])]);
      setHasNext(data.hasNext);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more search results:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasNext, query, page, source]);

  const handleSelectComic = (slug: string) => {
    if (query.trim()) {
      addSearchHistory(query.trim());
      setHistory(getSearchHistory());
    }
    closeSearch();
    navigate(`/${source}/detail/${slug}`);
  };

  const handleSelectQuery = (text: string) => {
    setQuery(text);
    addSearchHistory(text);
    setHistory(getSearchHistory());
  };

  const handleRemoveHistory = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    removeSearchHistory(item);
    setHistory(getSearchHistory());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-base flex flex-col animate-in fade-in duration-150">
      {/* Search Header Bar */}
      <div className="shrink-0 h-14 border-b border-line px-3 sm:px-4 flex items-center gap-2 bg-surface">
        <button
          type="button"
          onClick={closeSearch}
          aria-label="Kembali"
          className="p-2 -ml-1 text-muted hover:text-main cursor-pointer active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-muted absolute left-3 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari manga, manhwa, manhua..."
            className="w-full pl-9 pr-8 py-2 bg-base border border-line text-sm text-main placeholder-muted rounded-sm focus:outline-none focus:border-accent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 text-muted hover:text-main p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={closeSearch}
          className="text-xs font-mono text-muted hover:text-main px-2 py-1 cursor-pointer"
        >
          Batal
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto max-w-2xl w-full mx-auto p-4 space-y-6">
        {/* If no query, show Recent Searches & Popular Genres */}
        {!query.trim() && (
          <>
            {history.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-muted">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    Pencarian terakhir
                  </span>
                </div>

                <div className="divide-y divide-line border border-line bg-surface rounded-sm">
                  {history.map((item) => (
                    <div
                      key={item}
                      onClick={() => handleSelectQuery(item)}
                      className="flex items-center justify-between px-3 py-2.5 hover:bg-surface-hover transition-colors cursor-pointer text-xs"
                    >
                      <span className="text-main font-medium">{item}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveHistory(e, item)}
                        aria-label={`Hapus ${item}`}
                        className="p-1 text-muted hover:text-accent cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Genres */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                Genre populer
              </span>

              <div className="flex flex-wrap gap-1.5">
                {POPULAR_GENRES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      closeSearch();
                      navigate(`/${source}/genre/${g.toLowerCase().replace(/\s+/g, '-')}`);
                    }}
                    className="px-2.5 py-1 text-xs font-mono bg-surface border border-line text-muted hover:text-main hover:border-accent rounded-sm transition-colors cursor-pointer"
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Live Search Results */}
        {query.trim() && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-muted">
              <span>HASIL PENCARIAN</span>
              {isLoading && <span>Mencari...</span>}
            </div>

            {isLoading && results.length === 0 && (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-surface border border-line rounded-sm" />
                ))}
              </div>
            )}

            {!isLoading && results.length === 0 && (
              <div className="py-12 text-center text-xs text-muted border border-line bg-surface rounded-sm">
                Tidak ada hasil untuk '{query}'.
              </div>
            )}

            {results.length > 0 && (
              <div className="border border-line bg-surface rounded-sm divide-y divide-line">
                {results.map((comic) => (
                  <div
                    key={comic.slug}
                    onClick={() => handleSelectComic(comic.slug)}
                    className="flex items-center gap-3 p-2.5 hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <div className="shrink-0 w-10 h-14 bg-base border border-line rounded-sm overflow-hidden">
                      <img
                        src={getProxiedImageUrl(comic.image)}
                        alt={comic.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-medium text-main truncate">
                        {comic.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-muted mt-0.5">
                        {comic.type && <span className="uppercase">{comic.type}</span>}
                        {comic.rating && (
                          <>
                            <span className="text-subtle">·</span>
                            <span className="text-accent font-semibold">★ {comic.rating}</span>
                          </>
                        )}
                      </div>
                      {comic.latest && (
                        <p className="text-[10px] font-mono text-subtle truncate mt-0.5">
                          {comic.latest}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sentinel for automatic infinite scroll */}
            <div
              ref={(el) => {
                if (!el || !hasNext || isLoadingMore) return;
                const observer = new IntersectionObserver(
                  (entries) => {
                    if (entries[0].isIntersecting && hasNext && !isLoadingMore) {
                      loadMore();
                    }
                  },
                  { rootMargin: '600px' }
                );
                observer.observe(el);
              }}
              className="h-4 w-full pointer-events-none"
            />

            {isLoadingMore && (
              <div className="space-y-2 pt-1">
                {[...Array(3)].map((_, i) => (
                  <div key={`skel-more-${i}`} className="h-16 bg-surface border border-line rounded-sm animate-pulse" />
                ))}
              </div>
            )}

            {!hasNext && results.length > 0 && (
              <p className="text-center text-[11px] font-mono text-muted/60 py-4">
                Sudah sampai akhir.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
