import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { ComicCard, ComicSource } from '../types/comic';
import { getProxiedImageUrl } from '../lib/api';

interface HeroCarouselProps {
  comics: ComicCard[];
  source: ComicSource;
}

export function HeroCarousel({ comics, source }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const items = comics.slice(0, 5);

  // Auto advance every 6 seconds unless touched
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      handleNext();
    } else if (distance < -50) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative border border-line bg-surface rounded-sm overflow-hidden p-3 sm:p-5 select-none"
    >
      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
        {/* Cover */}
        <Link
          to={`/${source}/detail/${current.slug}`}
          className="shrink-0 w-32 sm:w-40 aspect-[2/3] bg-base border border-line rounded-sm overflow-hidden block group"
        >
          <img
            src={getProxiedImageUrl(current.image)}
            alt={current.title}
            loading="eager"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch text-center sm:text-left py-1">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] font-mono text-muted mb-1.5">
              <span className="text-accent uppercase font-bold tracking-wider">
                KOMIK UNGGULAN
              </span>
              {current.type && (
                <>
                  <span className="text-subtle">·</span>
                  <span className="uppercase">{current.type}</span>
                </>
              )}
              {current.rating && (
                <>
                  <span className="text-subtle">·</span>
                  <span className="text-accent">★ {current.rating}</span>
                </>
              )}
            </div>

            <Link
              to={`/${source}/detail/${current.slug}`}
              className="font-serif text-lg sm:text-2xl font-bold text-main hover:text-accent transition-colors line-clamp-2 block leading-snug"
            >
              {current.title}
            </Link>

            <p className="text-xs text-muted font-mono mt-1.5">
              Rilisan terbaru: <span className="text-main font-medium">{current.latest || 'Tersedia'}</span>
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
            <Link
              to={`/${source}/detail/${current.slug}`}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-medium rounded-sm transition-colors active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Buka Komik</span>
            </Link>

            {/* Dots */}
            <div className="flex items-center gap-1.5 ml-2">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Lihat komik ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === activeIndex ? 'w-5 bg-accent' : 'w-1.5 bg-line hover:bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Prev / Next desktop chevron buttons */}
      {items.length > 1 && (
        <div className="hidden sm:flex items-center gap-1 absolute top-3 right-3">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Komik sebelumnya"
            className="p-1.5 bg-base border border-line text-muted hover:text-main rounded-sm cursor-pointer active:scale-90"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Komik berikutnya"
            className="p-1.5 bg-base border border-line text-muted hover:text-main rounded-sm cursor-pointer active:scale-90"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
