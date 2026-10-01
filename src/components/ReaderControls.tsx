import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChapterItem, ComicSource } from '../types/comic';

interface ReaderControlsProps {
  comicSlug: string;
  currentChapterSlug: string;
  source: ComicSource;
  allChapters?: ChapterItem[];
  prevSlug?: string | null;
  nextSlug?: string | null;
  scrollProgress: number; // 0 to 100
}

export function ReaderControls({
  comicSlug,
  currentChapterSlug,
  source,
  allChapters = [],
  prevSlug,
  nextSlug,
  scrollProgress,
}: ReaderControlsProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // If scrolled down by more than 20px, hide
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY) {
            // Scrolled up, show
            setIsVisible(true);
          }
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleSelectChapter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    if (slug) {
      navigate(`/${source}/chapter/${comicSlug}/${encodeURIComponent(slug)}`);
    }
  };

  return (
    <>
      {/* Top thin reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-line">
        <div
          className="h-full bg-accent transition-all duration-75"
          style={{ width: `${Math.min(100, Math.max(0, scrollProgress))}%` }}
        />
      </div>

      {/* Auto-hiding bottom controls bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-surface/95 border-t border-line transition-transform duration-150 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between gap-2 text-xs">
          {/* Back to detail link */}
          <Link
            to={`/${source}/detail/${comicSlug}`}
            className="text-muted hover:text-main shrink-0 font-mono"
            title="Kembali ke Info Komik"
          >
            [DETAIL]
          </Link>

          {/* Prev Chapter */}
          {prevSlug ? (
            <Link
              to={`/${source}/chapter/${comicSlug}/${encodeURIComponent(prevSlug)}`}
              className="px-2.5 py-1.5 bg-base border border-line text-main hover:text-accent font-medium rounded-sm transition-colors shrink-0"
            >
              ← Prev
            </Link>
          ) : (
            <span className="px-2.5 py-1.5 bg-base/50 border border-line text-subtle rounded-sm shrink-0 cursor-not-allowed">
              ← Prev
            </span>
          )}

          {/* Chapter Quick Select */}
          {allChapters.length > 0 ? (
            <select
              value={currentChapterSlug}
              onChange={handleSelectChapter}
              className="bg-base text-main border border-line text-xs font-mono py-1 px-2 rounded-sm focus:outline-none focus:border-accent min-w-0 max-w-[180px] sm:max-w-xs truncate cursor-pointer"
            >
              {allChapters.map((ch) => (
                <option key={ch.slug} value={ch.slug}>
                  {ch.title}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-muted font-mono truncate px-2">
              {currentChapterSlug}
            </span>
          )}

          {/* Next Chapter */}
          {nextSlug ? (
            <Link
              to={`/${source}/chapter/${comicSlug}/${encodeURIComponent(nextSlug)}`}
              className="px-2.5 py-1.5 bg-base border border-line text-main hover:text-accent font-medium rounded-sm transition-colors shrink-0"
            >
              Next →
            </Link>
          ) : (
            <span className="px-2.5 py-1.5 bg-base/50 border border-line text-subtle rounded-sm shrink-0 cursor-not-allowed">
              Next →
            </span>
          )}
        </div>
      </div>
    </>
  );
}
