import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HistoryItem } from '../types/comic';
import { getHistory, clearHistory } from '../lib/storage';
import { getProxiedImageUrl, formatRelativeTime } from '../lib/api';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';

export function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = () => {
    setHistory(getHistory());
  };

  useEffect(() => {
    loadHistory();
    window.addEventListener('yozora_history_change', loadHistory);
    return () => window.removeEventListener('yozora_history_change', loadHistory);
  }, []);

  const handleClear = () => {
    if (window.confirm('Hapus seluruh riwayat baca?')) {
      clearHistory();
      loadHistory();
    }
  };

  return (
    <>
      <Helmet>
        <title>Riwayat Baca — Yozora</title>
        <meta name="description" content="Riwayat komik dan chapter yang telah dibaca di Yozora." />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-line pb-2">
          <div className="flex items-baseline gap-2">
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-main">
              Riwayat Baca
            </h1>
            <span className="text-xs font-mono text-muted tabular-nums">
              ({history.length})
            </span>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-mono text-muted hover:text-accent cursor-pointer"
            >
              Hapus Semua
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <EmptyState message="Belum ada riwayat bacaan. Komik yang Anda baca akan otomatis tercatat di sini." />
        ) : (
          <div className="border border-line bg-surface rounded-sm divide-y divide-line">
            {history.map((item) => (
              <div
                key={`${item.src}-${item.comicSlug}-${item.chapterSlug}`}
                className="p-3 sm:p-4 flex items-center justify-between gap-4 hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.image && (
                    <div className="shrink-0 w-10 h-14 bg-base border border-line rounded-sm overflow-hidden hidden sm:block">
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
                    <Link
                      to={`/${item.src}/detail/${item.comicSlug}`}
                      className="text-xs sm:text-sm font-medium text-main hover:text-accent block truncate"
                    >
                      {item.comicTitle}
                    </Link>
                    <div className="text-xs font-mono text-muted mt-0.5 flex items-center gap-2">
                      <span className="text-accent">{item.chapterTitle}</span>
                      <span className="text-subtle">·</span>
                      <span className="text-[11px] uppercase">{item.src}</span>
                    </div>
                    <div className="text-[10px] font-mono text-subtle mt-0.5">
                      Dibaca {formatRelativeTime(new Date(item.readAt).toISOString())}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <Link
                    to={`/${item.src}/chapter/${item.comicSlug}/${encodeURIComponent(item.chapterSlug)}`}
                    className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors block text-center"
                  >
                    Lanjut
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
