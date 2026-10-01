import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ComicCard, ComicSource } from '../types/comic';
import { getProxiedImageUrl, formatRelativeTime } from '../lib/api';

interface ComicRowProps {
  comic: ComicCard;
  source: ComicSource;
  isLast?: boolean;
}

export function ComicRow({ comic, source, isLast }: ComicRowProps) {
  const [imageError, setImageError] = useState(false);
  const proxiedUrl = getProxiedImageUrl(comic.image);

  return (
    <div
      className={`flex items-center justify-between py-2 px-2.5 sm:px-3 hover:bg-surface transition-colors ${
        !isLast ? 'border-b border-line' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-3">
        <Link
          to={`/${source}/detail/${comic.slug}`}
          className="shrink-0 w-9 h-12 bg-surface border border-line rounded-sm overflow-hidden block"
        >
          {!imageError && proxiedUrl ? (
            <img
              src={proxiedUrl}
              alt={comic.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[9px] text-muted font-mono">
              N/A
            </div>
          )}
        </Link>

        <div className="min-w-0 flex flex-col justify-center">
          <Link
            to={`/${source}/detail/${comic.slug}`}
            className="text-xs sm:text-sm font-medium text-main hover:text-accent transition-colors truncate block leading-snug"
          >
            {comic.title}
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-muted font-mono mt-0.5">
            {comic.type && (
              <span className="text-subtle uppercase text-[10px] tracking-wide">
                {comic.type}
              </span>
            )}
            {comic.rating && (
              <>
                <span className="text-subtle">·</span>
                <span className="tabular-nums">★ {comic.rating}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right font-mono text-[11px] sm:text-xs">
        <div className="text-accent font-medium tabular-nums">
          {comic.latest || 'Baru'}
        </div>
        {comic.updatedAt && (
          <div className="text-muted text-[10px] tabular-nums mt-0.5">
            {formatRelativeTime(comic.updatedAt)}
          </div>
        )}
      </div>
    </div>
  );
}
