import { fetchApi } from '../api';
import { ChapterItem, ChapterPage, ComicCard, ComicDetail, GenreItem, Paged } from '../../types/comic';

function cleanMangaKitaItem(item: any): ComicCard | null {
  if (!item || !item.slug || !item.title) return null;

  // Extract latest chapter title/time
  let latest = '';
  let updatedAt = '';
  if (Array.isArray(item.chapters) && item.chapters.length > 0) {
    const ch = item.chapters[0];
    latest = ch?.title || (ch?.slug ? ch.slug.replace(/\.[0-9]+$/, '').replace(/-/g, ' ') : '');
    updatedAt = ch?.time || '';
  } else if (item.latestChapter) {
    latest = item.latestChapter;
  }

  // Format type
  let type = item.type || '';
  if (type) {
    type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }

  return {
    title: String(item.title).trim(),
    slug: String(item.slug).trim(),
    image: item.image || '',
    rating: item.rating ? String(item.rating).trim() : undefined,
    type: type || undefined,
    latest: latest || undefined,
    updatedAt: updatedAt || undefined,
  };
}

function dedupeAndFilter(items: any[]): ComicCard[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const results: ComicCard[] = [];

  for (const raw of items) {
    const card = cleanMangaKitaItem(raw);
    if (card && !seen.has(card.slug)) {
      seen.add(card.slug);
      results.push(card);
    }
  }
  return results;
}

export async function getMangakitaHome(): Promise<{
  popularToday: ComicCard[];
  projectUpdates: ComicCard[];
  latestReleases: ComicCard[];
}> {
  const data = await fetchApi<any>('/mangakita/home');
  return {
    popularToday: dedupeAndFilter(data.popularToday),
    projectUpdates: dedupeAndFilter(data.projectUpdates),
    latestReleases: dedupeAndFilter(data.latestReleases),
  };
}

export async function getMangakitaBrowse(kind: string, page: number = 1): Promise<Paged<ComicCard>> {
  let url = '';
  if (kind === 'projects') {
    url = `/mangakita/projects/${page}`;
  } else if (kind === 'popular') {
    url = `/mangakita/list?order=popular&page=${page}`;
  } else if (kind === 'latest') {
    url = `/mangakita/list?order=update&page=${page}`;
  } else if (kind === 'ongoing') {
    url = `/mangakita/list?status=ongoing&page=${page}`;
  } else if (kind === 'completed') {
    url = `/mangakita/list?status=completed&page=${page}`;
  } else if (kind === 'manga' || kind === 'manhwa' || kind === 'manhua') {
    url = `/mangakita/list?type=${kind}&page=${page}`;
  } else {
    url = `/mangakita/daftar-manga/${page}`;
  }

  const data = await fetchApi<any>(url);
  const rawList = data.mangaList || data.projects || data.results || [];
  const items = dedupeAndFilter(rawList);
  const hasNext = Boolean(data.pagination?.hasNextPage);

  return {
    items,
    hasNext,
    page,
  };
}

export async function getMangakitaGenres(): Promise<GenreItem[]> {
  const data = await fetchApi<any>('/mangakita/genres');
  if (!Array.isArray(data.genres)) return [];
  return data.genres
    .filter((g: any) => g?.name && g?.slug)
    .map((g: any) => ({
      name: String(g.name).trim(),
      slug: String(g.slug).trim(),
    }));
}

export async function getMangakitaByGenre(slug: string, page: number = 1): Promise<Paged<ComicCard>> {
  const data = await fetchApi<any>(`/mangakita/genres/${encodeURIComponent(slug)}/${page}`);
  const rawList = data.mangaList || [];
  const items = dedupeAndFilter(rawList);
  const hasNext = Boolean(data.pagination?.hasNextPage);

  return {
    items,
    hasNext,
    page,
  };
}

export async function searchMangakita(query: string, page: number = 1): Promise<Paged<ComicCard>> {
  const cleanQuery = encodeURIComponent(query.trim());
  const data = await fetchApi<any>(`/mangakita/search/${cleanQuery}/${page}`);
  const rawList = data.results || [];
  const items = dedupeAndFilter(rawList);
  const hasNext = Boolean(data.pagination?.hasNextPage);

  return {
    items,
    hasNext,
    page,
  };
}

export async function getMangakitaDetail(slug: string): Promise<ComicDetail> {
  const data = await fetchApi<any>(`/mangakita/detail/${encodeURIComponent(slug)}`);
  const details = data.details || {};

  const genres: string[] = [];
  if (Array.isArray(details.genres)) {
    for (const g of details.genres) {
      if (typeof g === 'string') genres.push(g.trim());
      else if (g?.name) genres.push(String(g.name).trim());
    }
  }

  const rawChapters = Array.isArray(details.chapters) ? details.chapters : [];
  let chapters: ChapterItem[] = rawChapters
    .filter((c: any) => c?.slug)
    .map((c: any) => ({
      title: c.title ? String(c.title).trim() : (c.slug ? String(c.slug).replace(/-/g, ' ') : 'Chapter'),
      slug: String(c.slug).trim(),
      date: c.date ? String(c.date).trim() : undefined,
    }));

  // Sembunyikan "Chapter 0" jika ada chapter lain
  if (chapters.length > 1) {
    const hasOtherChapters = chapters.some(c => !c.title.toLowerCase().includes('chapter 0') && !c.slug.toLowerCase().includes('chapter-0'));
    if (hasOtherChapters) {
      chapters = chapters.filter(c => !c.title.toLowerCase().includes('chapter 0') && !c.slug.toLowerCase().includes('chapter-0'));
    }
  }

  let type = details.info?.type || '';
  if (type) {
    type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }

  return {
    title: details.title || slug,
    image: details.image || '',
    synopsis: details.synopsis || '',
    rating: details.rating || undefined,
    status: details.info?.status || undefined,
    type: type || undefined,
    genres,
    chapters,
  };
}

export async function getMangakitaChapter(
  comicSlug: string,
  chapterSlug: string,
  debug: boolean = false
): Promise<ChapterPage> {
  const base = chapterSlug.replace(/\.[0-9]+$/, '');
  const candidateList = [
    encodeURIComponent(`${comicSlug}/${chapterSlug}`),
    `${comicSlug}/${chapterSlug}`,
    chapterSlug,
    base,
    `${comicSlug}-${base}`,
    `${comicSlug}-${chapterSlug}`,
  ];

  // dedupe candidates
  const candidates = Array.from(new Set(candidateList));
  const failedCandidates: string[] = [];
  let finalData: any = null;
  let finalCandidate = '';

  for (const cand of candidates) {
    try {
      const res = await fetchApi<any>(`/mangakita/chapter/${cand}`);
      if (Array.isArray(res.images) && res.images.length > 0) {
        finalData = res;
        finalCandidate = cand;
        break;
      } else {
        failedCandidates.push(cand);
      }
    } catch {
      failedCandidates.push(cand);
    }
  }

  if (!finalData) {
    throw new Error(
      `Gagal memuat chapter gambar. ${debug ? `Kandidat gagal: ${failedCandidates.join(', ')}` : 'Coba chapter lain atau muat ulang.'}`
    );
  }

  let images: string[] = (finalData.images || []).map((img: any) => {
    if (typeof img === 'string') return img;
    return img?.image || img?.url || '';
  }).filter(Boolean);

  // Buang gambar yang mengandung "/wp-content/uploads/" bila masih ada sisanya
  const filtered = images.filter(url => !url.includes('/wp-content/uploads/'));
  if (filtered.length > 0) {
    images = filtered;
  }

  return {
    title: finalData.title || finalData.chapter || chapterSlug,
    images,
    comic: comicSlug,
    prev: finalData.navigation?.prev || null,
    next: finalData.navigation?.next || null,
    debugCandidates: debug ? failedCandidates : undefined,
  };
}
