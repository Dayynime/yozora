import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { BookOpen, ChevronRight, X } from 'lucide-react';
import { ComicSource, ComicCard as ComicCardType } from '../types/comic';
import { getUnifiedHome } from '../lib/adapters';
import {
  getAllContinueReading,
  removeContinueReading,
  restoreContinueReading,
  getHistory,
  restoreHistoryItem,
  deleteHistoryItem,
  ContinueReadingData,
} from '../lib/storage';
import { useToast } from '../context/ToastContext';
import { getProxiedImageUrl } from '../lib/api';
import { HeroCarousel } from '../components/HeroCarousel';
import { HorizontalSnapRow } from '../components/HorizontalSnapRow';
import { ComicCard } from '../components/ComicCard';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { PullToRefresh } from '../components/PullToRefresh';

interface HomePageProps {
  source: ComicSource;
}

const CATEGORY_CHIPS = [
  { id: 'all', label: 'Semua' },
  { id: 'manga', label: 'Manga' },
  { id: 'manhwa', label: 'Manhwa' },
  { id: 'manhua', label: 'Manhua' },
  { id: 'colored', label: 'Berwarna' },
  { id: 'completed', label: 'Tamat' },
];

export function HomePage({ source }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { showToast } = useToast();
  const [continueList, setContinueList] = useState<ContinueReadingData[]>(() =>
    getAllContinueReading().slice(0, 3)
  );

  const loadContinue = useCallback(() => {
    setContinueList(getAllContinueReading().slice(0, 3));
  }, []);

  // Perbarui otomatis saat data lanjut baca / riwayat berubah
  useEffect(() => {
    window.addEventListener('yozora_continue_change', loadContinue);
    window.addEventListener('yozora_history_change', loadContinue);
    window.addEventListener('storage', loadContinue);
    return () => {
      window.removeEventListener('yozora_continue_change', loadContinue);
      window.removeEventListener('yozora_history_change', loadContinue);
      window.removeEventListener('storage', loadContinue);
    };
  }, [loadContinue]);

  const handleRemoveContinue = (item: ContinueReadingData) => {
    const historyEntry = getHistory().find(
      (h) => h.comicSlug === item.comicSlug && h.src === item.src
    );
    deleteHistoryItem(item.comicSlug, item.src); // hapus riwayat + lanjut baca
    removeContinueReading(item.comicSlug, item.src);
    showToast(
      'Dihapus dari Lanjut baca',
      'Urungkan',
      () => {
        restoreContinueReading(item);
        if (historyEntry) restoreHistoryItem(historyEntry);
      },
      5000
    );
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['home', source],
    queryFn: () => getUnifiedHome(source),
    staleTime: 5 * 60 * 1000,
  });

  // Filter comics based on selectedCategory locally
  const filterByCat = (items: ComicCardType[] = []) => {
    if (selectedCategory === 'all') return items;
    if (selectedCategory === 'manga') return items.filter((c) => c.type?.toLowerCase() === 'manga');
    if (selectedCategory === 'manhwa') return items.filter((c) => c.type?.toLowerCase() === 'manhwa');
    if (selectedCategory === 'manhua') return items.filter((c) => c.type?.toLowerCase() === 'manhua');
    if (selectedCategory === 'colored') {
      return items.filter((c) => c.type?.toLowerCase() === 'manhwa' || c.type?.toLowerCase() === 'manhua');
    }
    if (selectedCategory === 'completed') {
      return items.filter((c) => c.latest?.toLowerCase().includes('end') || c.latest?.toLowerCase().includes('tamat'));
    }
    return items;
  };

  const filteredFeatured = useMemo(() => filterByCat(data?.featured), [data?.featured, selectedCategory]);
  const filteredLatest = useMemo(() => filterByCat(data?.latest), [data?.latest, selectedCategory]);
  const filteredPopular = useMemo(() => filterByCat(data?.popular), [data?.popular, selectedCategory]);
  const filteredProjects = useMemo(() => filterByCat(data?.projects), [data?.projects, selectedCategory]);

  return (
    <>
      <Helmet>
        <title>Yozora — Baca komik online, bahasa Indonesia.</title>
        <meta
          name="description"
          content={`Baca manga, manhwa, dan manhua terkini bahasa Indonesia di Yozora.`}
        />
      </Helmet>

      <PullToRefresh onRefresh={() => refetch()}>
        <div className="space-y-6 pb-12">
          {/* Scrollable Category Chips Strip */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
            {CATEGORY_CHIPS.map((chip) => {
              const isSelected = selectedCategory === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedCategory(chip.id)}
                  className={`px-3.5 py-1.5 text-xs font-mono rounded-sm transition-colors cursor-pointer shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-accent text-white font-medium'
                      : 'bg-surface border border-line text-muted hover:text-main hover:border-accent'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-6">
              <div className="h-44 sm:h-52 bg-surface border border-line rounded-sm" />
              <div className="h-40 bg-surface border border-line rounded-sm" />
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-surface border border-line rounded-sm" />
                ))}
              </div>
            </div>
          )}

          {/* Error per section */}
          {isError && (
            <ErrorState
              message={`Gagal memuat beranda dari sumber ${source}.`}
              onRetry={() => refetch()}
            />
          )}

          {data && (
            <>
              {/* Swipeable Featured Hero */}
              {(filteredFeatured.length > 0 ? filteredFeatured : data.featured).length > 0 && (
                <HeroCarousel
                  comics={filteredFeatured.length > 0 ? filteredFeatured : data.featured}
                  source={source}
                />
              )}

              {/* Lanjut Baca Strip (Multi-item if available) */}
              {continueList.length > 0 && (
                <section className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-line pb-1.5">
                    <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-1.5 font-bold">
                      <BookOpen className="w-3.5 h-3.5 text-accent" />
                      Lanjut baca
                    </span>
                    <Link
                      to="/pustaka"
                      className="text-xs font-mono text-muted hover:text-accent transition-colors"
                    >
                      Pustaka →
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {continueList.map((item) => (
                      <div
                        key={`${item.src}-${item.comicSlug}`}
                        className="bg-surface border border-line p-2.5 rounded-sm flex items-center justify-between gap-3 hover:border-accent transition-colors group"
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          {item.image && (
                            <div className="shrink-0 w-8 h-11 bg-base border border-line rounded-sm overflow-hidden">
                              <img
                                src={getProxiedImageUrl(item.image)}
                                alt={item.comicTitle}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-medium text-main truncate group-hover:text-accent transition-colors">
                              {item.comicTitle}
                            </h4>
                            <p className="text-[10px] font-mono text-muted truncate mt-0.5">
                              {item.chapterTitle}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1">
                          <Link
                            to={`/${item.src}/chapter/${item.comicSlug}/${encodeURIComponent(item.chapterSlug)}`}
                            className="px-2.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-medium rounded-sm transition-colors active:scale-95"
                          >
                            Lanjut
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleRemoveContinue(item)}
                            aria-label={`Hapus ${item.comicTitle} dari Lanjut baca`}
                            className="w-9 h-9 flex items-center justify-center text-muted hover:text-main transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Update Terbaru: Cards with 'Baru' badge and scroll-snap */}
              <HorizontalSnapRow
                title="Update Terbaru"
                linkTo={`/${source}/browse/latest`}
                comics={filteredLatest}
                source={source}
                count={filteredLatest.length}
              />

              {/* Komik Populer: Horizontal Snap */}
              <HorizontalSnapRow
                title="Komik Populer"
                linkTo={`/${source}/browse/popular`}
                comics={filteredPopular}
                source={source}
                count={filteredPopular.length}
              />

              {/* Project Rilis: Horizontal Snap */}
              {filteredProjects.length > 0 && (
                <HorizontalSnapRow
                  title="Project Rilis"
                  linkTo={`/${source}/browse/projects`}
                  comics={filteredProjects}
                  source={source}
                  count={filteredProjects.length}
                />
              )}

              {/* Komik Baru (Westmanga extra) */}
              {data.extra && data.extra.items.length > 0 && (
                <HorizontalSnapRow
                  title={data.extra.title}
                  linkTo={`/${source}/browse/latest`}
                  comics={filterByCat(data.extra.items)}
                  source={source}
                  count={data.extra.items.length}
                />
              )}

              {/* Grid of Latest for quick browsing */}
              <section className="space-y-3 pt-4">
                <div className="flex items-baseline justify-between border-b border-line pb-2">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-main tracking-tight">
                    Rilisan Terkini
                  </h3>
                  <Link
                    to={`/${source}/browse/latest`}
                    className="text-xs font-mono text-muted hover:text-accent"
                  >
                    Jelajah Penuh →
                  </Link>
                </div>

                {filteredLatest.length === 0 ? (
                  <EmptyState message="Tidak ada komik yang sesuai dengan filter kategori ini." />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
                    {filteredLatest.slice(0, 18).map((comic) => (
                      <ComicCard key={comic.slug} comic={comic} source={source} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </PullToRefresh>
    </>
  );
}
