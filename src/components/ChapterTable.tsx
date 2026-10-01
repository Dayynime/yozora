import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChapterItem, ComicSource } from '../types/comic';
import { formatRelativeTime } from '../lib/api';

interface ChapterTableProps {
  chapters: ChapterItem[];
  comicSlug: string;
  source: ComicSource;
  lastReadChapterSlug?: string;
}

export function ChapterTable({
  chapters,
  comicSlug,
  source,
  lastReadChapterSlug,
}: ChapterTableProps) {
  const [filterText, setFilterText] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  const displayedChapters = useMemo(() => {
    let list = [...chapters];
    if (filterText.trim()) {
      const q = filterText.toLowerCase().trim();
      list = list.filter(
        c => c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
      );
    }
    if (sortAsc) {
      list.reverse();
    }
    return list;
  }, [chapters, filterText, sortAsc]);

  if (chapters.length === 0) {
    return (
      <div className="py-6 px-4 text-center border border-line bg-surface rounded-sm text-xs text-muted">
        Daftar chapter belum tersedia.
      </div>
    );
  }

  return (
    <div className="border border-line rounded-sm bg-base overflow-hidden">
      {/* Table controls */}
      <div className="flex items-center justify-between gap-3 p-2 sm:p-2.5 bg-surface border-b border-line">
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Cari chapter (cth. 120)..."
          className="bg-base border border-line text-xs text-main placeholder-muted px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-accent w-48 sm:w-64"
        />

        <button
          type="button"
          onClick={() => setSortAsc(!sortAsc)}
          className="text-xs font-mono px-2 py-1 bg-base border border-line text-muted hover:text-main rounded-sm transition-colors cursor-pointer shrink-0"
        >
          {sortAsc ? 'URUT: LAMA → BARU' : 'URUT: BARU → LAMA'}
        </button>
      </div>

      {/* Chapter rows */}
      <div className="max-h-[500px] overflow-y-auto divide-y divide-line">
        {displayedChapters.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted">
            Tidak ada chapter yang cocok dengan "{filterText}".
          </div>
        ) : (
          displayedChapters.map((ch) => {
            const isLastRead = lastReadChapterSlug === ch.slug;
            return (
              <Link
                key={ch.slug}
                to={`/${source}/chapter/${comicSlug}/${encodeURIComponent(ch.slug)}`}
                className={`flex items-center justify-between px-3 py-2 text-xs hover:bg-surface transition-colors ${
                  isLastRead ? 'bg-surface font-semibold text-accent' : 'text-main'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate font-mono">{ch.title}</span>
                  {isLastRead && (
                    <span className="text-[10px] font-mono text-accent uppercase tracking-wider">
                      [TERAKHIR DIBACA]
                    </span>
                  )}
                </div>

                {ch.date && (
                  <span className="text-[11px] font-mono text-muted tabular-nums shrink-0 ml-3">
                    {formatRelativeTime(ch.date)}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
