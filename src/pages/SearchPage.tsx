import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search } from 'lucide-react';
import { ComicSource, ComicCard as ComicCardType } from '../types/comic';
import { searchUnified } from '../lib/adapters';
import { useInfiniteList } from '../hooks/useInfiniteList';
import { InfiniteGrid } from '../components/InfiniteGrid';
import { SectionHeader } from '../components/SectionHeader';

interface SearchPageProps {
  source: ComicSource;
}

export function SearchPage({ source }: SearchPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [inputVal, setInputVal] = useState(q);

  useEffect(() => {
    setInputVal(q);
  }, [q]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() });
    }
  };

  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isError,
    fetchNextPage,
    refetch,
  } = useInfiniteList<ComicCardType>(
    ['search-infinite', source, q],
    (page) => searchUnified(source, q, page),
    { enabled: Boolean(q.trim()) }
  );

  return (
    <>
      <Helmet>
        <title>{q ? `Hasil pencarian "${q}" — Yozora` : 'Pencarian Komik — Yozora'}</title>
        <meta name="description" content={`Cari komik manga, manhwa, dan manhua di Yozora.`} />
      </Helmet>

      <div className="space-y-6 pb-16">
        {/* Search input form */}
        <div className="border border-line bg-surface p-3 sm:p-4 rounded-sm">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Cari judul komik..."
                className="w-full bg-base border border-line text-sm text-main placeholder-muted pl-9 pr-3 py-2 rounded-sm focus:outline-none focus:border-accent"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-medium rounded-sm transition-colors cursor-pointer active:scale-95"
            >
              Cari
            </button>
          </form>
        </div>

        {q && (
          <SectionHeader
            title={`Hasil pencarian: "${q}"`}
            count={items.length}
          />
        )}

        {q ? (
          <InfiniteGrid
            items={items}
            source={source}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={Boolean(hasNextPage)}
            isError={isError}
            fetchNextPage={fetchNextPage}
            refetch={refetch}
            emptyMessage={`Tidak ada hasil untuk '${q}'.`}
          />
        ) : (
          <div className="py-12 text-center text-xs font-mono text-muted border border-line bg-surface rounded-sm">
            Ketik kata kunci judul komik pada kotak pencarian di atas.
          </div>
        )}
      </div>
    </>
  );
}
