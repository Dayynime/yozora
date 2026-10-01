import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Bookmark, Share2, BookOpen, Search, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { ComicSource, ChapterItem } from '../types/comic';
import { getUnifiedDetail } from '../lib/adapters';
import { getProxiedImageUrl, formatRelativeTime } from '../lib/api';
import {
  isBookmarked,
  toggleBookmark,
  getContinueReading,
  getHistory,
  ContinueReadingData,
} from '../lib/storage';
import { useToast } from '../context/ToastContext';
import { ErrorState } from '../components/ErrorState';

interface DetailPageProps {
  source: ComicSource;
}

export function DetailPage({ source }: DetailPageProps) {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [bookmarked, setBookmarked] = useState(false);
  const [continueData, setContinueData] = useState<ContinueReadingData | null>(null);
  const [activeTab, setActiveTab] = useState<'chapters' | 'info'>('chapters');
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [chapterSearch, setChapterSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['detail', source, slug],
    queryFn: () => getUnifiedDetail(source, slug),
    staleTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    setBookmarked(isBookmarked(slug, source));
    setContinueData(getContinueReading(slug, source));

    const handleBookmarkChange = () => {
      setBookmarked(isBookmarked(slug, source));
    };

    window.addEventListener('yozora_bookmark_change', handleBookmarkChange);
    return () => window.removeEventListener('yozora_bookmark_change', handleBookmarkChange);
  }, [slug, source]);

  // Read history to dim already-read chapters
  const readChaptersSet = useMemo(() => {
    const historyList = getHistory().filter((h) => h.comicSlug === slug && h.src === source);
    return new Set(historyList.map((h) => h.chapterSlug));
  }, [slug, source]);

  // Optimistic Bookmark Toggle with Toast & Undo
  const handleToggleBookmark = () => {
    if (!data) return;
    const latestChapter = data.chapters[0]?.title || '';
    const willBeBookmarked = !bookmarked;
    setBookmarked(willBeBookmarked); // optimistic

    toggleBookmark({
      comicSlug: slug,
      title: data.title,
      image: data.image,
      type: data.type,
      src: source,
      latestChapter,
    });

    if (willBeBookmarked) {
      showToast('Ditambahkan ke bookmark', 'Urungkan', () => {
        setBookmarked(false);
        toggleBookmark({
          comicSlug: slug,
          title: data.title,
          image: data.image,
          type: data.type,
          src: source,
          latestChapter,
        });
      });
    } else {
      showToast('Dihapus dari bookmark');
    }
  };

  // Web Share API
  const handleShare = async () => {
    if (!data) return;
    const shareData = {
      title: `${data.title} — Yozora`,
      text: `Baca komik ${data.title} online bahasa Indonesia di Yozora`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Tautan berhasil disalin ke clipboard');
      } catch {
        showToast('Gagal menyalin tautan');
      }
    }
  };

  // Chapters list calculation
  const chapters = data?.chapters || [];

  // Determine smart primary action:
  // If user previously read, resume that chapter
  // Else, start from Chapter 1 (oldest chapter, typically chapters[chapters.length - 1])
  const oldestChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;
  const targetChapter = continueData
    ? { slug: continueData.chapterSlug, title: continueData.chapterTitle }
    : oldestChapter;

  const handlePrimaryCta = () => {
    if (targetChapter) {
      navigate(`/${source}/chapter/${slug}/${encodeURIComponent(targetChapter.slug)}`);
    }
  };

  // Filtered & sorted chapters
  const displayedChapters = useMemo(() => {
    let list = [...chapters];
    if (chapterSearch.trim()) {
      const q = chapterSearch.toLowerCase().trim();
      list = list.filter(
        (c) => c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
      );
    }
    if (sortAsc) {
      list.reverse();
    }
    return list;
  }, [chapters, chapterSearch, sortAsc]);

  return (
    <>
      <Helmet>
        <title>{data ? `${data.title} — Yozora` : 'Detail Komik — Yozora'}</title>
        <meta
          name="description"
          content={data?.synopsis ? data.synopsis.slice(0, 160) : `Baca komik ${data?.title || slug} di Yozora.`}
        />
      </Helmet>

      {isLoading && (
        <div className="space-y-6 pb-12">
          <div className="flex flex-col sm:flex-row gap-5 p-4 bg-surface border border-line rounded-sm">
            <div className="w-36 sm:w-48 aspect-[2/3] bg-base rounded-sm" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-3/4 bg-base rounded-sm" />
              <div className="h-20 w-full bg-base rounded-sm" />
              <div className="h-10 w-full bg-base rounded-sm" />
            </div>
          </div>
          <div className="h-64 bg-surface border border-line rounded-sm" />
        </div>
      )}

      {isError && (
        <ErrorState
          message="Gagal memuat detail komik. Silakan coba lagi."
          onRetry={() => refetch()}
        />
      )}

      {data && (
        <div className="space-y-6 pb-20">
          {/* Header Card: Big Cover + Title + Smart CTA + Action buttons */}
          <div className="bg-surface border border-line p-4 sm:p-6 rounded-sm">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              {/* Cover */}
              <div className="shrink-0 w-36 sm:w-48 aspect-[2/3] bg-base border border-line rounded-sm overflow-hidden">
                <img
                  src={getProxiedImageUrl(data.image)}
                  alt={data.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch text-center sm:text-left">
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono text-muted mb-1.5">
                    {data.type && <span className="uppercase font-semibold">{data.type}</span>}
                    <span className="text-subtle">·</span>
                    <span>{data.status || 'Berjalan'}</span>
                    {data.rating && (
                      <>
                        <span className="text-subtle">·</span>
                        <span className="text-accent font-bold">★ {data.rating}</span>
                      </>
                    )}
                  </div>

                  <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-main leading-tight">
                    {data.title}
                  </h1>

                  {/* Synopsis (3 lines with toggle) */}
                  <div className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
                    <p className={!isSynopsisExpanded ? 'line-clamp-3' : 'whitespace-pre-line'}>
                      {data.synopsis || 'Tidak ada deskripsi sinopsis untuk komik ini.'}
                    </p>
                    {data.synopsis && data.synopsis.length > 140 && (
                      <button
                        type="button"
                        onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                        className="mt-1 text-xs font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer mx-auto sm:mx-0"
                      >
                        <span>{isSynopsisExpanded ? 'Lebih sedikit' : 'Selengkapnya'}</span>
                        {isSynopsisExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Action Buttons Row */}
                <div className="mt-5 pt-4 border-t border-line flex flex-col sm:flex-row items-center gap-3">
                  {/* Smart CTA Button */}
                  <button
                    type="button"
                    onClick={handlePrimaryCta}
                    disabled={!targetChapter}
                    className="w-full sm:flex-1 py-3 px-4 bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-mono font-bold uppercase tracking-wider rounded-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>
                      {continueData
                        ? `Lanjutkan ${continueData.chapterTitle}`
                        : `Mulai Baca ${oldestChapter?.title || 'Ch. 1'}`}
                    </span>
                  </button>

                  {/* Bookmark and Share Icon Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                    <button
                      type="button"
                      onClick={handleToggleBookmark}
                      aria-label="Bookmark"
                      className={`min-w-[48px] min-h-[44px] px-3.5 py-2.5 rounded-sm border transition-colors cursor-pointer active:scale-95 flex items-center gap-2 text-xs font-mono ${
                        bookmarked
                          ? 'bg-accent border-accent text-white font-semibold'
                          : 'bg-base border-line text-muted hover:text-main hover:border-accent'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-white' : ''}`} />
                      <span className="sm:hidden">{bookmarked ? 'Tersimpan' : 'Bookmark'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      aria-label="Bagikan komik"
                      className="min-w-[48px] min-h-[44px] px-3.5 py-2.5 rounded-sm border border-line bg-base text-muted hover:text-main hover:border-accent transition-colors cursor-pointer active:scale-95 flex items-center gap-2 text-xs font-mono"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="sm:hidden">Bagikan</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Tabs Bar: "Chapter" vs "Info" */}
          <div className="sticky top-13 z-20 bg-surface border-b border-line -mx-3 px-3 sm:mx-0 sm:px-0">
            <div className="flex items-center gap-6 text-xs font-mono uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setActiveTab('chapters')}
                className={`py-3 border-b-2 font-bold cursor-pointer transition-colors ${
                  activeTab === 'chapters'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-main'
                }`}
              >
                Chapter ({chapters.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`py-3 border-b-2 font-bold cursor-pointer transition-colors ${
                  activeTab === 'info'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-main'
                }`}
              >
                Info Detail
              </button>
            </div>
          </div>

          {/* Tab Content: Chapters */}
          {activeTab === 'chapters' && (
            <div className="space-y-3">
              {/* Search and Sort controls */}
              <div className="flex items-center justify-between gap-3 p-2 bg-surface border border-line rounded-sm">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={chapterSearch}
                    onChange={(e) => setChapterSearch(e.target.value)}
                    placeholder="Cari nomor chapter..."
                    className="w-full pl-8 pr-3 py-1.5 bg-base border border-line text-xs font-mono text-main placeholder-muted rounded-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSortAsc(!sortAsc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-base border border-line hover:border-accent text-xs font-mono text-muted hover:text-main rounded-sm cursor-pointer transition-colors"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-accent" />
                  <span>{sortAsc ? 'Lama ke Baru' : 'Baru ke Lama'}</span>
                </button>
              </div>

              {/* 56px Height Chapter Rows */}
              <div className="divide-y divide-line border border-line bg-surface rounded-sm">
                {displayedChapters.length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-muted">
                    Tidak ada chapter yang cocok.
                  </div>
                ) : (
                  displayedChapters.map((ch) => {
                    const isCurrent = continueData?.chapterSlug === ch.slug;
                    const isAlreadyRead = readChaptersSet.has(ch.slug);

                    return (
                      <Link
                        key={ch.slug}
                        to={`/${source}/chapter/${slug}/${encodeURIComponent(ch.slug)}`}
                        className={`h-14 px-4 flex items-center justify-between hover:bg-surface-hover transition-colors group ${
                          isAlreadyRead ? 'opacity-60 hover:opacity-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`text-xs font-mono font-medium truncate group-hover:text-accent transition-colors ${
                              isCurrent ? 'text-accent font-bold' : 'text-main'
                            }`}
                          >
                            {ch.title}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 bg-accent text-white text-[9px] font-mono uppercase font-bold rounded-sm shrink-0">
                              Sedang Dibaca
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
          )}

          {/* Tab Content: Info */}
          {activeTab === 'info' && (
            <div className="bg-surface border border-line p-4 sm:p-5 rounded-sm space-y-4">
              <h3 className="font-serif text-base font-bold text-main">Informasi Komik</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono border-t border-line pt-3">
                <div className="flex gap-2">
                  <dt className="w-20 text-muted shrink-0">Status:</dt>
                  <dd className="text-main font-medium">{data.status || 'Ongoing'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 text-muted shrink-0">Tipe:</dt>
                  <dd className="text-main font-medium">{data.type || 'Komik'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 text-muted shrink-0">Sumber:</dt>
                  <dd className="text-muted uppercase font-bold">{source}</dd>
                </div>
                {data.rating && (
                  <div className="flex gap-2">
                    <dt className="w-20 text-muted shrink-0">Rating:</dt>
                    <dd className="text-accent font-bold">★ {data.rating}</dd>
                  </div>
                )}
                {data.genres.length > 0 && (
                  <div className="sm:col-span-2 flex gap-2 pt-2 border-t border-line">
                    <dt className="w-20 text-muted shrink-0">Genre:</dt>
                    <dd className="text-main flex flex-wrap gap-1.5">
                      {data.genres.map((g) => (
                        <Link
                          key={g}
                          to={`/${source}/genre/${encodeURIComponent(g.toLowerCase().replace(/\s+/g, '-'))}`}
                          className="px-2 py-0.5 bg-base border border-line hover:border-accent text-xs rounded-sm transition-colors"
                        >
                          {g}
                        </Link>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      )}
    </>
  );
}
