import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { ComicSource } from '../types/comic';
import { getUnifiedGenres } from '../lib/adapters';
import { SectionHeader } from '../components/SectionHeader';
import { ErrorState } from '../components/ErrorState';

interface GenresPageProps {
  source: ComicSource;
}

export function GenresPage({ source }: GenresPageProps) {
  const { data: genres, isLoading, isError, refetch } = useQuery({
    queryKey: ['genres', source],
    queryFn: () => getUnifiedGenres(source),
    staleTime: 24 * 60 * 60 * 1000,
  });

  return (
    <>
      <Helmet>
        <title>Daftar Genre — Yozora</title>
        <meta name="description" content="Jelajahi komik berdasarkan kategori genre di Yozora." />
      </Helmet>

      <div className="space-y-6">
        <SectionHeader title="Daftar Genre" count={genres?.length} />

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="h-10 bg-surface border border-line rounded-sm" />
            ))}
          </div>
        )}

        {isError && (
          <ErrorState
            message="Gagal memuat daftar genre."
            onRetry={() => refetch()}
          />
        )}

        {genres && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {genres.map((genre) => (
              <Link
                key={genre.slug}
                to={`/${source}/genre/${genre.slug}`}
                className="p-2.5 bg-surface border border-line text-xs font-mono text-main hover:text-accent hover:border-accent rounded-sm transition-colors block text-left"
              >
                <span>{genre.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
