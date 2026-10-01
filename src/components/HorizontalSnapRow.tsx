import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ComicCard as ComicCardType, ComicSource } from '../types/comic';
import { ComicCard } from './ComicCard';

interface HorizontalSnapRowProps {
  title: string;
  linkTo: string;
  comics: ComicCardType[];
  source: ComicSource;
  count?: number;
}

export function HorizontalSnapRow({
  title,
  linkTo,
  comics,
  source,
  count,
}: HorizontalSnapRowProps) {
  if (comics.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Header with full list link */}
      <div className="flex items-baseline justify-between border-b border-line pb-2">
        <Link
          to={linkTo}
          className="group flex items-center gap-1.5 hover:text-accent transition-colors"
        >
          <h2 className="font-serif text-base sm:text-lg font-bold text-main group-hover:text-accent tracking-tight">
            {title}
          </h2>
          {count !== undefined && (
            <span className="text-xs font-mono text-muted tabular-nums">
              ({count})
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          to={linkTo}
          className="text-xs font-mono text-muted hover:text-accent transition-colors shrink-0"
        >
          Lihat Semua →
        </Link>
      </div>

      {/* Snap-x row */}
      <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-none -mx-1 px-1">
        {comics.map((comic) => (
          <div
            key={comic.slug}
            className="shrink-0 w-28 sm:w-36 snap-start"
          >
            <ComicCard comic={comic} source={source} />
          </div>
        ))}
      </div>
    </section>
  );
}
