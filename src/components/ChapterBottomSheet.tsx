import { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { ChapterItem } from '../types/comic';

interface ChapterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterItem[];
  currentChapterSlug: string;
  onSelectChapter: (slug: string) => void;
}

export function ChapterBottomSheet({
  isOpen,
  onClose,
  chapters,
  currentChapterSlug,
  onSelectChapter,
}: ChapterBottomSheetProps) {
  const [filterText, setFilterText] = useState('');

  const filtered = useMemo(() => {
    if (!filterText.trim()) return chapters;
    const q = filterText.toLowerCase().trim();
    return chapters.filter(
      (c) => c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [chapters, filterText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 animate-in fade-in duration-150">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="w-full max-w-md mx-auto bg-surface border-t border-line rounded-t-md p-4 max-h-[80vh] flex flex-col space-y-3 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <h3 className="font-serif text-base font-bold text-main">Daftar Chapter</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1 text-muted hover:text-main cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Cari chapter (cth. 14)..."
            className="w-full pl-8 pr-3 py-1.5 bg-base border border-line text-xs font-mono text-main placeholder-muted rounded-sm focus:outline-none focus:border-accent"
          />
        </div>

        {/* List of chapters */}
        <div className="flex-1 overflow-y-auto divide-y divide-line border border-line rounded-sm bg-base max-h-72">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted font-mono">
              Tidak ada chapter yang cocok.
            </div>
          ) : (
            filtered.map((ch) => {
              const isCurrent = ch.slug === currentChapterSlug || ch.slug.endsWith(currentChapterSlug);
              return (
                <button
                  key={ch.slug}
                  type="button"
                  onClick={() => {
                    onSelectChapter(ch.slug);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left font-mono hover:bg-surface transition-colors cursor-pointer ${
                    isCurrent ? 'bg-surface text-accent font-bold' : 'text-main'
                  }`}
                >
                  <span className="truncate">{ch.title}</span>
                  {isCurrent && (
                    <span className="text-[10px] text-accent uppercase font-bold tracking-wider shrink-0 ml-2">
                      [SEDANG DIBACA]
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
