import { useState, useEffect } from 'react';
import { X, SlidersHorizontal, Check } from 'lucide-react';
import { GenreItem } from '../types/comic';

export interface FilterState {
  type: string; // all, manga, manhwa, manhua
  status: string; // all, ongoing, completed
  order: string; // latest, popular
  genres: string[];
}

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (newFilters: FilterState) => void;
  availableGenres: GenreItem[];
}

const TYPE_OPTIONS = [
  { id: '', label: 'Semua Tipe' },
  { id: 'manga', label: 'Manga (JP)' },
  { id: 'manhwa', label: 'Manhwa (KR)' },
  { id: 'manhua', label: 'Manhua (CN)' },
];

const STATUS_OPTIONS = [
  { id: '', label: 'Semua Status' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Tamat' },
];

const ORDER_OPTIONS = [
  { id: 'latest', label: 'Update Terbaru' },
  { id: 'popular', label: 'Paling Populer' },
];

export function FilterBottomSheet({
  isOpen,
  onClose,
  filters,
  onApply,
  availableGenres,
}: FilterBottomSheetProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const handleToggleGenre = (slug: string) => {
    setLocalFilters((prev) => {
      const exists = prev.genres.includes(slug);
      const updated = exists ? prev.genres.filter((g) => g !== slug) : [...prev.genres, slug];
      return { ...prev, genres: updated };
    });
  };

  const handleReset = () => {
    const cleared: FilterState = {
      type: '',
      status: '',
      order: 'latest',
      genres: [],
    };
    setLocalFilters(cleared);
  };

  // Count active filters
  let activeCount = 0;
  if (localFilters.type) activeCount++;
  if (localFilters.status) activeCount++;
  if (localFilters.order !== 'latest') activeCount++;
  activeCount += localFilters.genres.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 animate-in fade-in duration-150">
      {/* Backdrop click */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Sheet Content */}
      <div className="w-full max-w-lg mx-auto bg-surface border-t border-line rounded-t-md p-4 sm:p-5 max-h-[85vh] flex flex-col space-y-4 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-accent" />
            <h3 className="font-serif text-base font-bold text-main">Filter Komik</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup filter"
            className="p-1 text-muted hover:text-main cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Filters */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
          {/* Tipe */}
          <div className="space-y-2">
            <label className="font-mono text-muted uppercase tracking-wider block">Tipe Komik</label>
            <div className="grid grid-cols-2 gap-1.5">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, type: opt.id })}
                  className={`p-2 text-left font-mono rounded-sm border transition-colors cursor-pointer flex items-center justify-between ${
                    localFilters.type === opt.id
                      ? 'bg-base border-accent text-accent font-semibold'
                      : 'bg-base border-line text-muted hover:text-main'
                  }`}
                >
                  <span>{opt.label}</span>
                  {localFilters.type === opt.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="font-mono text-muted uppercase tracking-wider block">Status Rilis</label>
            <div className="grid grid-cols-3 gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, status: opt.id })}
                  className={`p-2 text-center font-mono rounded-sm border transition-colors cursor-pointer ${
                    localFilters.status === opt.id
                      ? 'bg-base border-accent text-accent font-semibold'
                      : 'bg-base border-line text-muted hover:text-main'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Urutan */}
          <div className="space-y-2">
            <label className="font-mono text-muted uppercase tracking-wider block">Urutan</label>
            <div className="grid grid-cols-2 gap-1.5">
              {ORDER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, order: opt.id })}
                  className={`p-2 text-center font-mono rounded-sm border transition-colors cursor-pointer ${
                    localFilters.order === opt.id
                      ? 'bg-base border-accent text-accent font-semibold'
                      : 'bg-base border-line text-muted hover:text-main'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genres (Multi-select) */}
          {availableGenres.length > 0 && (
            <div className="space-y-2">
              <label className="font-mono text-muted uppercase tracking-wider block">
                Genre ({localFilters.genres.length} dipilih)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 bg-base border border-line rounded-sm">
                {availableGenres.map((g) => {
                  const isSelected = localFilters.genres.includes(g.slug);
                  return (
                    <button
                      key={g.slug}
                      type="button"
                      onClick={() => handleToggleGenre(g.slug)}
                      className={`px-2 py-1 text-[11px] font-mono rounded-sm border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-accent text-white border-accent font-medium'
                          : 'bg-surface text-muted border-line hover:text-main'
                      }`}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-line pt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 text-xs font-mono text-muted hover:text-accent cursor-pointer active:scale-95"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={() => {
              onApply(localFilters);
              onClose();
            }}
            className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-medium rounded-sm transition-colors cursor-pointer active:scale-95 text-center"
          >
            Terapkan {activeCount > 0 ? `(${activeCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
