import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { ComicCard as ComicCardType, ComicSource } from '../types/comic';
import { ComicCard } from './ComicCard';
import { ComicRow } from './ComicRow';
import { EmptyState } from './EmptyState';

interface InfiniteGridProps {
  items: ComicCardType[];
  source: ComicSource;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  viewMode?: 'grid' | 'list';
  emptyMessage?: string;
  scrollRestorationKey?: string;
}

export function InfiniteGrid({
  items,
  source,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  isError,
  fetchNextPage,
  refetch,
  viewMode = 'grid',
  emptyMessage = 'Tidak ada komik yang ditemukan.',
  scrollRestorationKey,
}: InfiniteGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const isRestoredRef = useRef(false);

  const storageKey = scrollRestorationKey || `scroll_${location.pathname}${location.search}`;

  // Restore scroll position once data is available
  useEffect(() => {
    if (items.length > 0 && !isRestoredRef.current) {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const y = parseInt(saved, 10);
        if (!isNaN(y) && y > 0) {
          window.scrollTo({ top: y, behavior: 'instant' });
        }
      }
      isRestoredRef.current = true;
    }
  }, [items.length, storageKey]);

  // Save scroll position on scroll
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          sessionStorage.setItem(storageKey, String(window.scrollY));
          // Show "ke atas" button after scrolling past 2 screens
          setShowScrollTop(window.scrollY > window.innerHeight * 2);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [storageKey]);

  // IntersectionObserver for infinite scrolling with 600px rootMargin
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    if (!hasNextPage || isFetchingNextPage || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        rootMargin: '600px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      {/* Initial Loading Skeleton */}
      {isLoading && items.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {[...Array(18)].map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] w-full bg-surface border border-line rounded-sm"
            />
          ))}
        </div>
      )}

      {/* Main Content (Grid or List) */}
      {items.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {items.map((comic) => (
                <div
                  key={comic.slug}
                  style={{
                    contentVisibility: 'auto',
                    containIntrinsicSize: '180px 270px',
                  }}
                >
                  <ComicCard comic={comic} source={source} />
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-line rounded-sm bg-base overflow-hidden">
              {items.map((comic, idx) => (
                <ComicRow
                  key={comic.slug}
                  comic={comic}
                  source={source}
                  isLast={idx === items.length - 1}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && !isError && (
        <EmptyState message={emptyMessage} />
      )}

      {/* Next Page Skeleton Rows */}
      {isFetchingNextPage && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 pt-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={`next-skel-${i}`}
              className="aspect-[2/3] w-full bg-surface border border-line rounded-sm animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Sentinel Element for IntersectionObserver */}
      <div ref={sentinelRef} className="h-4 w-full pointer-events-none" />

      {/* Accessibility Fallback Button */}
      {hasNextPage && !isFetchingNextPage && (
        <div className="sr-only">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            aria-label="Muat halaman komik berikutnya"
          >
            Muat lebih banyak komik
          </button>
        </div>
      )}

      {/* Error under list with retry */}
      {isError && (
        <div className="py-4 text-center text-xs font-mono text-muted space-y-2">
          <p>Gagal memuat. Coba lagi.</p>
          <button
            type="button"
            onClick={() => {
              if (items.length > 0) fetchNextPage();
              else refetch();
            }}
            className="px-3 py-1 bg-surface border border-line hover:border-accent text-accent rounded-sm cursor-pointer active:scale-95"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Finished end of list text */}
      {!hasNextPage && items.length > 0 && !isFetchingNextPage && (
        <div className="py-8 text-center text-xs font-mono text-muted/70">
          Sudah sampai akhir.
        </div>
      )}

      {/* Floating Scroll to Top button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Kembali ke atas"
          className="fixed bottom-18 md:bottom-8 right-4 z-40 p-2.5 bg-surface text-main border border-line hover:border-accent hover:text-accent rounded-sm shadow-sm cursor-pointer active:scale-90 transition-all duration-150"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
