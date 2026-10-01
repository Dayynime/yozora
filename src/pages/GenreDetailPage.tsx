import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ComicSource, ComicCard as ComicCardType } from '../types/comic';
import { getUnifiedByGenre } from '../lib/adapters';
import { useInfiniteList } from '../hooks/useInfiniteList';
import { InfiniteGrid } from '../components/InfiniteGrid';
import { SectionHeader } from '../components/SectionHeader';

interface GenreDetailPageProps {
  source: ComicSource;
}

export function GenreDetailPage({ source }: GenreDetailPageProps) {
  const { slug = '' } = useParams<{ slug: string }>();

  const formattedGenre = slug
    ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
    : 'Genre';

  // Use reusable infinite list hook
  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isError,
    fetchNextPage,
    refetch,
  } = useInfiniteList<ComicCardType>(
    ['genre-infinite', source, slug],
    (page) => getUnifiedByGenre(source, slug, page)
  );

  return (
    <>
      <Helmet>
        <title>{`Komik Genre ${formattedGenre} — Yozora`}</title>
        <meta
          name="description"
          content={`Daftar komik dengan genre ${formattedGenre} di Yozora dengan infinite scroll otomatis.`}
        />
      </Helmet>

      <div className="space-y-4 pb-16">
        <SectionHeader
          title={`Genre: ${formattedGenre}`}
          count={items.length}
        />

        <InfiniteGrid
          items={items}
          source={source}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={Boolean(hasNextPage)}
          isError={isError}
          fetchNextPage={fetchNextPage}
          refetch={refetch}
          emptyMessage={`Belum ada komik dengan genre ${formattedGenre}.`}
        />
      </div>
    </>
  );
}
