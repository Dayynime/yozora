import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookmarkItem } from '../types/comic';
import { getBookmarks, removeBookmark } from '../lib/storage';
import { getProxiedImageUrl, formatRelativeTime } from '../lib/api';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';

export function BookmarkPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  const loadBookmarks = () => {
    setBookmarks(getBookmarks());
  };

  useEffect(() => {
    loadBookmarks();
    window.addEventListener('yozora_bookmark_change', loadBookmarks);
    return () => window.removeEventListener('yozora_bookmark_change', loadBookmarks);
  }, []);

  const handleRemove = (item: BookmarkItem) => {
    removeBookmark(item.comicSlug, item.src);
    loadBookmarks();
  };

  return (
    <>
      <Helmet>
        <title>Bookmark — Yozora</title>
        <meta name="description" content="Daftar komik favorit yang disimpan di Yozora." />
      </Helmet>

      <div className="space-y-6">
        <SectionHeader title="Bookmark Tersimpan" count={bookmarks.length} />

        {bookmarks.length === 0 ? (
          <EmptyState message="Belum ada komik yang ditandai sebagai bookmark. Klik tombol bookmark di halaman komik untuk menyimpannya di sini." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {bookmarks.map((item) => (
              <div
                key={`${item.src}-${item.comicSlug}`}
                className="group relative border border-line bg-surface rounded-sm overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <Link
                    to={`/${item.src}/detail/${item.comicSlug}`}
                    className="block aspect-[2/3] w-full bg-base overflow-hidden relative"
                  >
                    <img
                      src={getProxiedImageUrl(item.image)}
                      alt={item.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <span className="absolute top-1 left-1 px-1 py-0.5 bg-base/90 border border-line text-[9px] font-mono uppercase text-muted">
                      {item.src}
                    </span>
                  </Link>

                  <div className="p-2 space-y-1">
                    <Link
                      to={`/${item.src}/detail/${item.comicSlug}`}
                      className="text-xs font-medium text-main hover:text-accent line-clamp-1 block"
                    >
                      {item.title}
                    </Link>
                    <p className="text-[10px] text-muted font-mono truncate">
                      {item.latestChapter || 'Tersedia'}
                    </p>
                    <p className="text-[9px] text-subtle font-mono">
                      Disimpan {formatRelativeTime(new Date(item.addedAt).toISOString())}
                    </p>
                  </div>
                </div>

                <div className="p-2 pt-0 border-t border-line mt-1 flex items-center justify-between gap-1">
                  <Link
                    to={`/${item.src}/detail/${item.comicSlug}`}
                    className="text-[11px] font-mono text-accent hover:underline"
                  >
                    Baca
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    className="text-[10px] font-mono text-muted hover:text-accent cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
