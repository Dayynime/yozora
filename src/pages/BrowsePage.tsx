import { useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { SlidersHorizontal, Grid, List, X } from 'lucide-react';
import { ComicSource, ComicCard as ComicCardType } from '../types/comic';
import { getUnifiedBrowse, getUnifiedGenres } from '../lib/adapters';
import { useInfiniteList } from '../hooks/useInfiniteList';
import { InfiniteGrid } from '../components/InfiniteGrid';
import { FilterBottomSheet, FilterState } from '../components/FilterBottomSheet';

interface BrowsePageProps {
  source: ComicSource;
}

export function BrowsePage({ source }: BrowsePageProps) {
  const { kind: pathKind } = useParams<{ kind?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state from URL query parameters or path
  const typeParam = searchParams.get('type') || (['manga', 'manhwa', 'manhua'].includes(pathKind || '') ? pathKind! : '');
  const statusParam = searchParams.get('status') || (['ongoing', 'completed'].includes(pathKind || '') ? pathKind! : '');
  const orderParam = searchParams.get('order') || (pathKind === 'popular' ? 'popular' : 'latest');
  const genresParam = searchParams.get('genres') ? searchParams.get('genres')!.split(',') : [];

  const [filters, setFilters] = useState<FilterState>({
    type: typeParam,
    status: statusParam,
    order: orderParam,
    genres: genresParam,
  });

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Available genres for filter sheet
  const { data: availableGenres = [] } = useQuery({
    queryKey: ['genres', source],
    queryFn: () => getUnifiedGenres(source),
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Determine kind to fetch
  const effectiveKind = pathKind === 'projects'
    ? 'projects'
    : (filters.order === 'popular' ? 'popular' : (filters.type || pathKind || 'latest'));

  // Sync state to URL params
  const updateUrlParams = (newFilters: FilterState) => {
    const params = new URLSearchParams();
    if (newFilters.type) params.set('type', newFilters.type);
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.order && newFilters.order !== 'latest') params.set('order', newFilters.order);
    if (newFilters.genres.length > 0) params.set('genres', newFilters.genres.join(','));
    setSearchParams(params, { replace: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const removeFilter = (key: keyof FilterState, value?: string) => {
    let updated = { ...filters };
    if (key === 'genres' && value) {
      updated.genres = updated.genres.filter((g) => g !== value);
    } else if (key === 'order') {
      updated.order = 'latest';
    } else {
      updated[key] = '' as any;
    }
    setFilters(updated);
    updateUrlParams(updated);
  };

  // Reusable Infinite List hook
  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isError,
    fetchNextPage,
    refetch,
  } = useInfiniteList<ComicCardType>(
    ['browse-list', source, effectiveKind, filters.status, filters.genres.join(',')],
    (page) => getUnifiedBrowse(source, effectiveKind, page)
  );

  // Active filter chips
  const activeChips: { key: keyof FilterState; label: string; value?: string }[] = [];
  if (filters.type) {
    activeChips.push({ key: 'type', label: `Tipe: ${filters.type.toUpperCase()}` });
  }
  if (filters.status) {
    activeChips.push({ key: 'status', label: `Status: ${filters.status}` });
  }
  if (filters.order !== 'latest') {
    activeChips.push({ key: 'order', label: 'Urutan: Populer' });
  }
  filters.genres.forEach((g) => {
    const matched = availableGenres.find((ag) => ag.slug === g);
    activeChips.push({ key: 'genres', label: matched?.name || g, value: g });
  });

  return (
    <>
      <Helmet>
        <title>Jelajah Komik — Yozora</title>
        <meta name="description" content="Jelajahi komik manga, manhwa, dan manhua di Yozora dengan infinite scroll otomatis." />
      </Helmet>

      <div className="space-y-4 pb-16">
        {/* Controls Bar: Filter Button, Count, Grid/List Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-line hover:border-accent text-xs font-mono text-main rounded-sm cursor-pointer active:scale-95 transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
              <span>Filter {activeChips.length > 0 ? `(${activeChips.length})` : ''}</span>
            </button>

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center p-0.5 bg-surface border border-line rounded-sm">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Tampilan Grid"
                className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-base text-accent' : 'text-muted hover:text-main'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="Tampilan Daftar"
                className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-base text-accent' : 'text-muted hover:text-main'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <span className="text-xs font-mono text-muted tabular-nums">
            {items.length} komik dimuat
          </span>
        </div>

        {/* Active Filter Chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-mono text-muted mr-1">Filter aktif:</span>
            {activeChips.map((chip, idx) => (
              <span
                key={`${chip.key}-${chip.value || idx}`}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-surface border border-line text-xs font-mono text-main rounded-sm"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={() => removeFilter(chip.key, chip.value)}
                  className="text-muted hover:text-accent cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => {
                const cleared: FilterState = { type: '', status: '', order: 'latest', genres: [] };
                setFilters(cleared);
                updateUrlParams(cleared);
              }}
              className="text-[11px] font-mono text-accent hover:underline ml-1 cursor-pointer"
            >
              Hapus Semua
            </button>
          </div>
        )}

        {/* Unified Infinite Grid */}
        <InfiniteGrid
          items={items}
          source={source}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={Boolean(hasNextPage)}
          isError={isError}
          fetchNextPage={fetchNextPage}
          refetch={refetch}
          viewMode={viewMode}
          emptyMessage="Tidak ada komik yang cocok dengan filter yang dipilih."
        />
      </div>

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
        availableGenres={availableGenres}
      />
    </>
  );
}
