import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ComicCard as ComicCardType, ComicSource } from '../types/comic';
import { getProxiedImageUrl, formatRelativeTime } from '../lib/api';
import { getUnifiedDetail } from '../lib/adapters';
import { getContinueReading } from '../lib/storage';

interface ComicCardProps {
  comic: ComicCardType;
  source: ComicSource;
  rank?: number;
  isNew?: boolean;
}

export function ComicCard({ comic, source, rank, isNew }: ComicCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const queryClient = useQueryClient();

  const proxiedUrl = getProxiedImageUrl(comic.image);

  // Check if unread (if user has read this comic, but this is a newer chapter)
  const continueData = getContinueReading(comic.slug, source);
  const hasUnread = continueData && comic.latest && !continueData.chapterTitle.includes(comic.latest);

  // Auto detect if <24h
  const isRecentRelease = isNew || (comic.updatedAt && (
    comic.updatedAt.includes('menit') ||
    comic.updatedAt.includes('jam') ||
    comic.updatedAt.includes('baru')
  ));

  // Prefetch comic detail on hover or touchstart
  const handlePrefetch = () => {
    queryClient.prefetchQuery({
      queryKey: ['detail', source, comic.slug],
      queryFn: () => getUnifiedDetail(source, comic.slug),
      staleTime: 30 * 60 * 1000,
    });
  };

  return (
    <Link
      to={`/${source}/detail/${comic.slug}`}
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
      className="group block text-left text-main active:scale-[0.97] transition-transform duration-100"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface border border-line rounded-sm">
        {/* Rank Number */}
        {rank !== undefined && (
          <span className="absolute top-1 left-1 z-10 px-1.5 py-0.5 bg-base border border-line text-xs font-mono font-bold text-main tabular-nums leading-none">
            {rank < 10 ? `0${rank}` : rank}
          </span>
        )}

        {/* 'Baru' Badge */}
        {isRecentRelease && (
          <span className="absolute top-1 right-1 z-10 px-1.5 py-0.5 bg-accent text-white text-[10px] font-mono uppercase font-bold tracking-wider leading-none rounded-sm">
            Baru
          </span>
        )}

        {/* Type tag bottom right */}
        {comic.type && (
          <span className="absolute bottom-1 right-1 z-10 px-1 py-0.5 text-[9px] uppercase font-mono font-medium tracking-wider bg-base/90 border border-line text-muted">
            {comic.type}
          </span>
        )}

        {/* Unread indicator dot */}
        {hasUnread && (
          <span
            title="Ada chapter baru yang belum dibaca"
            className="absolute bottom-1 left-1 z-10 w-2 h-2 rounded-full bg-accent"
          />
        )}

        {!imageError && proxiedUrl ? (
          <img
            src={proxiedUrl}
            alt={comic.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-muted font-mono bg-surface">
            <span>[NO COVER]</span>
          </div>
        )}
      </div>

      <div className="mt-1.5 space-y-0.5">
        <h3 className="text-xs sm:text-sm font-medium leading-tight truncate text-main group-hover:text-accent transition-colors">
          {comic.title}
        </h3>
        <p className="text-[11px] text-muted truncate tabular-nums font-mono">
          {comic.latest || 'Tersedia'}
          {comic.updatedAt && (
            <>
              <span className="mx-1 text-subtle">·</span>
              <span>{formatRelativeTime(comic.updatedAt)}</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
