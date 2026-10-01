import { useState, useEffect, useRef, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Paged } from '../types/comic';

interface HasSlug {
  slug: string;
}

export interface UseInfiniteListOptions {
  enabled?: boolean;
  staleTime?: number;
}

export function useInfiniteList<T extends HasSlug>(
  queryKey: unknown[],
  fetchPage: (page: number) => Promise<Paged<T>>,
  options: UseInfiniteListOptions = {}
) {
  const lastFetchTimeRef = useRef<number>(0);
  const consecutiveEmptyRef = useRef<number>(0);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      // Enforce minimum 300ms delay between consecutive requests to protect upstream
      const now = Date.now();
      const elapsed = now - lastFetchTimeRef.current;
      if (elapsed < 300) {
        await new Promise((resolve) => setTimeout(resolve, 300 - elapsed));
      }
      lastFetchTimeRef.current = Date.now();

      return fetchPage(pageParam as number);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || !lastPage.hasNext) return undefined;
      return allPages.length + 1;
    },
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    // Auto retry once with 1.5s delay before failing
    retry: 1,
    retryDelay: 1500,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  // Flatten and deduplicate all pages by slug
  const { items, lastPageAddedCount } = useMemo(() => {
    if (!data?.pages) return { items: [] as T[], lastPageAddedCount: 0 };

    const seen = new Set<string>();
    const deduplicated: T[] = [];
    let addedInLast = 0;

    const totalPages = data.pages.length;

    data.pages.forEach((page, pageIdx) => {
      const pageItems = page?.items || [];
      pageItems.forEach((item) => {
        if (item?.slug && !seen.has(item.slug)) {
          seen.add(item.slug);
          deduplicated.push(item);
          if (pageIdx === totalPages - 1) {
            addedInLast++;
          }
        }
      });
    });

    return { items: deduplicated, lastPageAddedCount: addedInLast };
  }, [data?.pages]);

  // If a page returned 0 new items while hasNextPage is still true,
  // automatically proceed to next page (up to 3 consecutive times)
  useEffect(() => {
    if (!data?.pages || data.pages.length === 0) return;
    if (isFetchingNextPage) return;

    if (hasNextPage && lastPageAddedCount === 0) {
      if (consecutiveEmptyRef.current < 3) {
        consecutiveEmptyRef.current++;
        fetchNextPage();
      }
    } else {
      consecutiveEmptyRef.current = 0;
    }
  }, [data?.pages, lastPageAddedCount, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    ...query,
    items,
  };
}
