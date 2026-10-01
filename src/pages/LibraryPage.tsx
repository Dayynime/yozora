import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Bookmark, Clock, Trash2, ArrowUpDown } from 'lucide-react';
import { BookmarkItem, HistoryItem } from '../types/comic';
import {
  getBookmarks,
  removeBookmark,
  toggleBookmark,
  restoreHistoryItem,
  restoreContinueReading,
  getHistory,
  deleteHistoryItem,
  clearHistory,
  getContinueReading,
} from '../lib/storage';
import { getProxiedImageUrl, formatRelativeTime } from '../lib/api';
import { ComicCard } from '../components/ComicCard';
import { EmptyState } from '../components/EmptyState';
import { PullToRefresh } from '../components/PullToRefresh';
import { useToast } from '../context/ToastContext';

export function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'bookmark' | 'history'>('bookmark');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [bookmarkSort, setBookmarkSort] = useState<'recent' | 'title' | 'updated'>('recent');

  const { showToast } = useToast();

  const loadData = () => {
    setBookmarks(getBookmarks());
    setHistory(getHistory());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('yozora_bookmark_change', loadData);
    window.addEventListener('yozora_history_change', loadData);
    return () => {
      window.removeEventListener('yozora_bookmark_change', loadData);
      window.removeEventListener('yozora_history_change', loadData);
    };
  }, []);

  const handleDeleteBookmark = (item: BookmarkItem) => {
    removeBookmark(item.comicSlug, item.src);
    loadData();
    showToast('Bookmark dihapus', 'Urungkan', () => {
      const { addedAt, ...rest } = item;
      toggleBookmark(rest); // tambahkan kembali
      loadData();
    }, 5000);
  };

  const handleDeleteHistory = (item: HistoryItem) => {
    const cont = getContinueReading(item.comicSlug, item.src);
    deleteHistoryItem(item.comicSlug, item.src);
    loadData();
    showToast('Dihapus dari riwayat', 'Urungkan', () => {
      restoreHistoryItem(item);
      if (cont) restoreContinueReading(cont);
      loadData();
    }, 5000);
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Hapus seluruh riwayat baca?')) {
      clearHistory();
      loadData();
      showToast('Seluruh riwayat baca dibersihkan');
    }
  };

  // Sorted bookmarks
  const sortedBookmarks = useMemo(() => {
    const list = [...bookmarks];
    if (bookmarkSort === 'title') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (bookmarkSort === 'updated') {
      return list.sort((a, b) => {
        const aCont = getContinueReading(a.comicSlug, a.src);
        const bCont = getContinueReading(b.comicSlug, b.src);
        const aHasNew = aCont && a.latestChapter && !aCont.chapterTitle.includes(a.latestChapter);
        const bHasNew = bCont && b.latestChapter && !bCont.chapterTitle.includes(b.latestChapter);
        return (bHasNew ? 1 : 0) - (aHasNew ? 1 : 0);
      });
    }
    // 'recent' by default (addedAt desc)
    return list.sort((a, b) => b.addedAt - a.addedAt);
  }, [bookmarks, bookmarkSort]);

  // Grouped history: "Hari ini", "Kemarin", "Minggu ini", "Lebih lama"
  const groupedHistory = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const today: HistoryItem[] = [];
    const yesterday: HistoryItem[] = [];
    const thisWeek: HistoryItem[] = [];
    const older: HistoryItem[] = [];

    history.forEach((item) => {
      const diff = now - item.readAt;
      if (diff < oneDay) {
        today.push(item);
      } else if (diff < 2 * oneDay) {
        yesterday.push(item);
      } else if (diff < 7 * oneDay) {
        thisWeek.push(item);
      } else {
        older.push(item);
      }
    });

    return [
      { title: 'Hari Ini', items: today },
      { title: 'Kemarin', items: yesterday },
      { title: 'Minggu Ini', items: thisWeek },
      { title: 'Lebih Lama', items: older },
    ].filter((g) => g.items.length > 0);
  }, [history]);

  return (
    <>
      <Helmet>
        <title>Pustaka — Yozora</title>
        <meta name="description" content="Pustaka komik tersimpan dan riwayat bacaan Anda di Yozora." />
      </Helmet>

      <PullToRefresh onRefresh={loadData}>
        <div className="space-y-6 pb-20">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-3">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('bookmark')}
                className={`flex items-center gap-2 pb-2 text-sm font-mono uppercase font-bold tracking-wider cursor-pointer border-b-2 transition-colors ${
                  activeTab === 'bookmark'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-main'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>Bookmark ({bookmarks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 pb-2 text-sm font-mono uppercase font-bold tracking-wider cursor-pointer border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-main'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Riwayat ({history.length})</span>
              </button>
            </div>

            {/* Sub-actions based on active tab */}
            {activeTab === 'bookmark' && bookmarks.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <ArrowUpDown className="w-3.5 h-3.5 text-accent" />
                <span className="text-muted">Urut:</span>
                <select
                  value={bookmarkSort}
                  onChange={(e) => setBookmarkSort(e.target.value as any)}
                  className="bg-surface border border-line text-main py-1 px-2 rounded-sm text-xs focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="recent">Terakhir Disimpan</option>
                  <option value="title">Judul (A-Z)</option>
                  <option value="updated">Ada Chapter Baru</option>
                </select>
              </div>
            )}

            {activeTab === 'history' && history.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllHistory}
                className="text-xs font-mono text-muted hover:text-accent flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua</span>
              </button>
            )}
          </div>

          {/* TAB 1: BOOKMARK */}
          {activeTab === 'bookmark' && (
            <div>
              {sortedBookmarks.length === 0 ? (
                <EmptyState message="Belum ada komik yang disimpan di Bookmark. Buka komik pilihan Anda dan ketuk tombol bookmark untuk menyimpannya di sini." />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {sortedBookmarks.map((item) => {
                    const continueData = getContinueReading(item.comicSlug, item.src);
                    const hasNewChapter =
                      continueData && item.latestChapter && !continueData.chapterTitle.includes(item.latestChapter);

                    return (
                      <div
                        key={`${item.src}-${item.comicSlug}`}
                        className="group relative flex flex-col justify-between"
                      >
                        <ComicCard
                          comic={{
                            title: item.title,
                            slug: item.comicSlug,
                            image: item.image,
                            type: item.type,
                            latest: item.latestChapter,
                          }}
                          source={item.src}
                        />

                        {/* Top action overlay button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteBookmark(item)}
                          aria-label="Hapus dari bookmark"
                          className="absolute top-1 right-1 z-20 p-1 bg-base/90 border border-line hover:border-accent text-muted hover:text-accent rounded-sm cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RIWAYAT */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {groupedHistory.length === 0 ? (
                <EmptyState message="Belum ada riwayat bacaan. Bab komik yang Anda buka akan otomatis tercatat di sini." />
              ) : (
                groupedHistory.map((group) => (
                  <div key={group.title} className="space-y-2">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
                      {group.title} ({group.items.length})
                    </h3>

                    <div className="border border-line bg-surface rounded-sm divide-y divide-line">
                      {group.items.map((item) => (
                        <div
                          key={`${item.src}-${item.comicSlug}-${item.chapterSlug}`}
                          className="p-3 flex items-center justify-between gap-3 hover:bg-surface-hover transition-colors group"
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
                              <div className="flex items-center gap-2 text-xs font-mono text-muted mt-0.5">
                                <span className="text-accent">{item.chapterTitle}</span>
                                <span className="text-subtle">·</span>
                                <span className="uppercase text-[10px]">{item.src}</span>
                              </div>
                              <div className="text-[10px] font-mono text-subtle mt-0.5">
                                {formatRelativeTime(new Date(item.readAt).toISOString())}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              to={`/${item.src}/chapter/${item.comicSlug}/${encodeURIComponent(item.chapterSlug)}`}
                              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-medium rounded-sm transition-colors active:scale-95"
                            >
                              Lanjut
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDeleteHistory(item)}
                              aria-label="Hapus riwayat"
                              className="p-1.5 text-muted hover:text-accent cursor-pointer active:scale-90"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </PullToRefresh>
    </>
  );
}
