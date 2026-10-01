import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Settings,
  ChevronLeft,
  ChevronRight,
  List,
  BookOpen,
} from 'lucide-react';
import { ComicSource } from '../types/comic';
import { getUnifiedChapter, getUnifiedDetail } from '../lib/adapters';
import { getProxiedImageUrl } from '../lib/api';
import {
  getReaderSettings,
  saveReaderSettings,
  ReaderSettings,
  saveContinueReading,
  saveHistory,
} from '../lib/storage';
import { ReaderSettingsSheet } from '../components/ReaderSettingsSheet';
import { ChapterBottomSheet } from '../components/ChapterBottomSheet';
import { ErrorState } from '../components/ErrorState';

interface ReaderPageProps {
  source: ComicSource;
}

export function ReaderPage({ source }: ReaderPageProps) {
  const { comic = '', '*': wildcard = '' } = useParams<{ comic: string; '*'?: string }>();
  const chapterSlug = decodeURIComponent(wildcard || '');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Reader Settings (persisted per comic)
  const [settings, setSettings] = useState<ReaderSettings>(() => getReaderSettings(comic));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChapterSheetOpen, setIsChapterSheetOpen] = useState(false);

  // Controls Visibility (Tap middle to toggle)
  const [controlsVisible, setControlsVisible] = useState(true);

  // Halaman (Paged) Mode state
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);

  // Fetch current chapter
  const {
    data: chapterData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['chapter', source, comic, chapterSlug, false],
    queryFn: () => getUnifiedChapter(source, comic, chapterSlug, false),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Fetch comic detail for chapters list & metadata
  const { data: detailData } = useQuery({
    queryKey: ['detail', source, comic],
    queryFn: () => getUnifiedDetail(source, comic),
    staleTime: 30 * 60 * 1000,
    enabled: Boolean(comic),
  });

  const images = useMemo(() => chapterData?.images || [], [chapterData?.images]);
  const allChapters = useMemo(() => detailData?.chapters || [], [detailData?.chapters]);

  // Compute prev/next chapter slugs
  let prevSlug = chapterData?.prev;
  let nextSlug = chapterData?.next;

  if (allChapters.length > 0 && (!prevSlug || !nextSlug)) {
    const idx = allChapters.findIndex(
      (c) => c.slug === chapterSlug || c.slug.endsWith(chapterSlug)
    );
    if (idx !== -1) {
      if (!prevSlug && idx < allChapters.length - 1) {
        prevSlug = allChapters[idx + 1].slug;
      }
      if (!nextSlug && idx > 0) {
        nextSlug = allChapters[idx - 1].slug;
      }
    }
  }

  // Prefetch NEXT chapter in background so transition is zero-delay
  useEffect(() => {
    if (nextSlug && comic) {
      queryClient.prefetchQuery({
        queryKey: ['chapter', source, comic, nextSlug, false],
        queryFn: () => getUnifiedChapter(source, comic, nextSlug, false),
        staleTime: 10 * 60 * 1000,
      });
    }
  }, [nextSlug, comic, source, queryClient]);

  // Save continue reading & history on mount / chapter change
  useEffect(() => {
    if (chapterData && comic && chapterSlug) {
      const comicTitle = detailData?.title || comic;
      const chapterTitle = chapterData.title || chapterSlug;

      saveContinueReading({
        comicSlug: comic,
        comicTitle,
        chapterSlug,
        chapterTitle,
        src: source,
        scrollY: window.scrollY,
        image: detailData?.image,
      });

      saveHistory({
        comicSlug: comic,
        comicTitle,
        chapterSlug,
        chapterTitle,
        src: source,
        image: detailData?.image,
      });
    }
  }, [chapterData, detailData, comic, chapterSlug, source]);

  // Reset page index when chapter changes
  useEffect(() => {
    setCurrentPageIndex(0);
    setZoomScale(1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [chapterSlug]);

  // Update reader settings handler
  const handleUpdateSettings = (newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveReaderSettings(updated, comic);
      return updated;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (settings.mode === 'paged') {
        if (settings.direction === 'rtl') {
          if (e.key === 'ArrowRight') handlePrevPage();
          if (e.key === 'ArrowLeft') handleNextPage();
        } else {
          if (e.key === 'ArrowLeft') handlePrevPage();
          if (e.key === 'ArrowRight') handleNextPage();
        }
      } else {
        if (e.key === 'ArrowLeft' && prevSlug) {
          navigate(`/${source}/chapter/${comic}/${encodeURIComponent(prevSlug)}`);
        } else if (e.key === 'ArrowRight' && nextSlug) {
          navigate(`/${source}/chapter/${comic}/${encodeURIComponent(nextSlug)}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Tap handler in Paged Mode (3 zones: left 30% = prev, middle 40% = toggle controls, right 30% = next)
  const handlePagedTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.3) {
      if (settings.direction === 'rtl') handleNextPage();
      else handlePrevPage();
    } else if (x > width * 0.7) {
      if (settings.direction === 'rtl') handlePrevPage();
      else handleNextPage();
    } else {
      setControlsVisible((prev) => !prev);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    } else if (prevSlug) {
      navigate(`/${source}/chapter/${comic}/${encodeURIComponent(prevSlug)}`);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < images.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    } else if (nextSlug) {
      navigate(`/${source}/chapter/${comic}/${encodeURIComponent(nextSlug)}`);
    }
  };

  // Double tap to zoom in Paged mode
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setZoomScale((prev) => (prev > 1 ? 1 : 2));
    }
    lastTapRef.current = now;
  };

  // Background style helper
  const bgClass =
    settings.background === 'black'
      ? 'bg-[#000000]'
      : settings.background === 'soft'
      ? 'bg-[#1c1c1c]'
      : 'bg-[#121212]';

  // Max width style helper
  const maxWidthClass =
    settings.maxWidth === 'full'
      ? 'max-w-none'
      : settings.maxWidth === '600px'
      ? 'max-w-[600px]'
      : 'max-w-[800px]';

  // Gap style helper (Webtoon mode)
  const gapClass =
    settings.gap === 'small' ? 'gap-1' : settings.gap === 'normal' ? 'gap-2' : 'gap-0';

  return (
    <>
      <Helmet>
        <title>{`${chapterData?.title || chapterSlug} — ${detailData?.title || comic} — Yozora`}</title>
        <meta
          name="description"
          content={`Baca ${chapterData?.title || chapterSlug} komik ${detailData?.title || comic} online bahasa Indonesia.`}
        />
      </Helmet>

      <div className={`min-h-screen text-[#e8e6e3] relative select-none ${bgClass}`}>
        {/* Top Bar: Back, Title, Settings Icon */}
        <header
          className={`fixed top-0 left-0 right-0 z-40 bg-surface/95 border-b border-line transition-transform duration-200 ${
            controlsVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="max-w-4xl mx-auto h-12 px-3 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => navigate(`/${source}/detail/${comic}`)}
                aria-label="Kembali ke Detail"
                className="p-1.5 -ml-1 text-muted hover:text-main cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <Link
                  to={`/${source}/detail/${comic}`}
                  className="font-medium text-main hover:text-accent truncate block text-xs"
                >
                  {detailData?.title || comic}
                </Link>
                <span className="text-[11px] text-accent truncate block">
                  {chapterData?.title || chapterSlug}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Pengaturan Pembaca"
              className="p-2 text-muted hover:text-main cursor-pointer active:scale-95 transition-transform"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="min-h-screen flex flex-col items-center justify-center space-y-3">
            <span className="w-3 h-3 rounded-full bg-accent animate-ping" />
            <p className="text-xs font-mono text-muted">Memuat halaman chapter...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="max-w-md mx-auto py-24 px-4">
            <ErrorState
              message={
                error instanceof Error
                  ? error.message
                  : 'Gagal memuat gambar chapter. Silakan coba lagi.'
              }
              onRetry={() => refetch()}
            />
          </div>
        )}

        {/* MODE 1: WEBTOON (Vertical Continuous Scroll) */}
        {!isLoading && chapterData && settings.mode === 'webtoon' && (
          <div
            onClick={() => setControlsVisible((prev) => !prev)}
            className={`mx-auto flex flex-col items-center pt-12 pb-24 ${maxWidthClass} ${gapClass}`}
          >
            {images.map((imgUrl, idx) => (
              <div
                key={`${imgUrl}-${idx}`}
                className="w-full relative min-h-[300px] bg-[#141414] flex items-center justify-center"
              >
                <img
                  src={getProxiedImageUrl(imgUrl)}
                  alt={`Halaman ${idx + 1}`}
                  loading={idx < 3 ? 'eager' : 'lazy'}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto block select-none"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      const fb = document.createElement('div');
                      fb.className =
                        'w-full py-16 text-center text-xs font-mono text-muted bg-[#161616] border border-line my-1';
                      fb.innerText = `[Gagal memuat halaman ${idx + 1}]`;
                      target.parentElement.appendChild(fb);
                    }
                  }}
                />
              </div>
            ))}

            {/* End of Chapter Card */}
            <div className="w-full max-w-md mx-auto p-6 text-center space-y-4 border-t border-line mt-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface border border-line rounded-sm text-xs font-mono text-muted">
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                <span>Chapter selesai</span>
              </div>

              <h4 className="font-serif text-lg font-bold text-main">
                {chapterData.title || chapterSlug}
              </h4>

              {nextSlug ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/${source}/chapter/${comic}/${encodeURIComponent(nextSlug!)}`);
                  }}
                  className="w-full py-3 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  Chapter Berikutnya →
                </button>
              ) : (
                <p className="text-xs font-mono text-muted">
                  Ini adalah chapter terbaru yang tersedia saat ini.
                </p>
              )}
            </div>
          </div>
        )}

        {/* MODE 2: HALAMAN (Paged Single View with Swipe / Click) */}
        {!isLoading && chapterData && settings.mode === 'paged' && images.length > 0 && (
          <div
            onClick={handlePagedTap}
            onTouchEnd={handleDoubleTap}
            className="fixed inset-0 flex items-center justify-center pt-12 pb-16 overflow-hidden cursor-pointer"
          >
            <div
              className={`w-full h-full flex items-center justify-center p-2 transition-transform duration-100 ${maxWidthClass}`}
              style={{ transform: `scale(${zoomScale})` }}
            >
              <img
                src={getProxiedImageUrl(images[currentPageIndex])}
                alt={`Halaman ${currentPageIndex + 1}`}
                className="max-h-full max-w-full object-contain select-none"
              />
            </div>

            {/* Tap Zone Helper Hints */}
            <div className="absolute bottom-20 left-4 text-[10px] font-mono text-muted/60 pointer-events-none">
              {settings.direction === 'rtl' ? 'Kanan: Prev | Kiri: Next' : 'Kiri: Prev | Kanan: Next'}
            </div>
          </div>
        )}

        {/* Bottom Bar: Slider scrub, Prev/Next chapter, Chapter list drawer */}
        <footer
          className={`fixed bottom-0 left-0 right-0 z-40 bg-surface/95 border-t border-line transition-transform duration-200 ${
            controlsVisible ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="max-w-2xl mx-auto px-4 py-2.5 space-y-2 text-xs font-mono">
            {/* Page Scrubber Slider */}
            {images.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted tabular-nums w-12 text-right">
                  {settings.mode === 'paged' ? currentPageIndex + 1 : 1}/{images.length}
                </span>

                <input
                  type="range"
                  min="0"
                  max={Math.max(0, images.length - 1)}
                  value={settings.mode === 'paged' ? currentPageIndex : 0}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    if (settings.mode === 'paged') {
                      setCurrentPageIndex(idx);
                    }
                  }}
                  className="flex-1 accent-accent cursor-pointer h-1.5 bg-line rounded-lg"
                />

                <span className="text-[11px] font-bold text-accent uppercase">
                  {settings.mode === 'paged' ? 'Hal' : 'Webtoon'}
                </span>
              </div>
            )}

            {/* Bottom Controls Row: Prev Chapter, Chapter Drawer Button, Next Chapter */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-line">
              <button
                type="button"
                disabled={!prevSlug}
                onClick={() => prevSlug && navigate(`/${source}/chapter/${comic}/${encodeURIComponent(prevSlug)}`)}
                className="flex items-center gap-1 px-3 py-1.5 bg-base border border-line hover:border-accent text-main hover:text-accent disabled:opacity-40 disabled:hover:border-line disabled:hover:text-main rounded-sm cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Ch.</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChapterSheetOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-base border border-line hover:border-accent text-main hover:text-accent rounded-sm cursor-pointer transition-colors"
              >
                <List className="w-4 h-4" />
                <span>Daftar Chapter</span>
              </button>

              <button
                type="button"
                disabled={!nextSlug}
                onClick={() => nextSlug && navigate(`/${source}/chapter/${comic}/${encodeURIComponent(nextSlug)}`)}
                className="flex items-center gap-1 px-3 py-1.5 bg-base border border-line hover:border-accent text-main hover:text-accent disabled:opacity-40 disabled:hover:border-line disabled:hover:text-main rounded-sm cursor-pointer transition-colors"
              >
                <span>Next Ch.</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </footer>

        {/* Reader Settings Bottom Sheet */}
        <ReaderSettingsSheet
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onChange={handleUpdateSettings}
        />

        {/* Quick Chapter Selector Bottom Sheet */}
        <ChapterBottomSheet
          isOpen={isChapterSheetOpen}
          onClose={() => setIsChapterSheetOpen(false)}
          chapters={allChapters}
          currentChapterSlug={chapterSlug}
          onSelectChapter={(slug) => {
            navigate(`/${source}/chapter/${comic}/${encodeURIComponent(slug)}`);
          }}
        />
      </div>
    </>
  );
}
