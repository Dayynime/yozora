import { fetchApi } from '../api';
import { ChapterItem, ChapterPage, ComicCard, ComicDetail, GenreItem, Paged } from '../../types/comic';

function mapCountryToType(countryId?: string): string {
  const c = String(countryId || '').toUpperCase();
  if (c === 'KR') return 'Manhwa';
  if (c === 'CN') return 'Manhua';
  if (c === 'JP') return 'Manga';
  return 'Komik';
}

function cleanWestmangaItem(item: any): ComicCard | null {
  if (!item || !item.slug || !item.title) return null;

  let latest = '';
  let updatedAt = '';

  if (Array.isArray(item.lastChapters) && item.lastChapters.length > 0) {
    const ch = item.lastChapters[0];
    latest = ch?.number ? `Ch. ${ch.number}` : (ch?.slug || '');
    updatedAt = ch?.updated_at?.formatted || '';
  } else if (Array.isArray(item.chapters) && item.chapters.length > 0) {
    const ch = item.chapters[0];
    latest = ch?.number ? `Ch. ${ch.number}` : (ch?.slug || '');
    updatedAt = ch?.updated_at?.formatted || '';
  }

  const type = mapCountryToType(item.country_id);

  return {
    title: String(item.title).trim(),
    slug: String(item.slug).trim(),
    image: item.cover || item.image || '',
    rating: item.rating ? String(item.rating).trim() : undefined,
    type,
    latest: latest || undefined,
    updatedAt: updatedAt || undefined,
  };
}

function dedupeAndFilter(items: any[]): ComicCard[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const results: ComicCard[] = [];

  for (const raw of items) {
    const card = cleanWestmangaItem(raw);
    if (card && !seen.has(card.slug)) {
      seen.add(card.slug);
      results.push(card);
    }
  }
  return results;
}

export function findImages(obj: unknown, set: Set<string> = new Set()): string[] {
  if (!obj) return Array.from(set);
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    if (
      /^https?:\/\/.+\.(jpe?g|png|webp|avif|gif)(\?.*)?$/i.test(trimmed) ||
      (trimmed.startsWith('http') &&
        (trimmed.includes('/storage') ||
          trimmed.includes('/covers') ||
          trimmed.includes('/chapter') ||
          trimmed.includes('/west/')))
    ) {
      set.add(trimmed);
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      findImages(item, set);
    }
  } else if (typeof obj === 'object') {
    for (const val of Object.values(obj as Record<string, unknown>)) {
      findImages(val, set);
    }
  }
  return Array.from(set);
}

export async function getWestmangaHome(): Promise<{
  popular: ComicCard[];
  mirrorUpdate: ComicCard[];
  projectUpdate: ComicCard[];
  newProject: ComicCard[];
}> {
  const data = await fetchApi<any>('/westmanga/home');
  const d = data.data || {};

  return {
    popular: dedupeAndFilter(d.popular),
    mirrorUpdate: dedupeAndFilter(d.mirror_update),
    projectUpdate: dedupeAndFilter(d.project_update),
    newProject: dedupeAndFilter(d.new_project),
  };
}

export async function getWestmangaBrowse(kind: string, page: number = 1): Promise<Paged<ComicCard>> {
  let endpoint = kind || 'latest';
  // Allowed endpoints: latest, popular, ongoing, completed, list, manga, manhwa, manhua, az, za, added, colored, uncolored, projects, others
  const validKinds = [
    'latest', 'popular', 'ongoing', 'completed', 'list',
    'manga', 'manhwa', 'manhua', 'az', 'za', 'added',
    'colored', 'uncolored', 'projects', 'others', 'new_project',
  ];
  if (!validKinds.includes(endpoint)) {
    endpoint = 'latest';
  }

  const data = await fetchApi<any>(`/westmanga/${endpoint}?page=${page}`);
  let rawList: any[] = [];
  if (Array.isArray(data.data)) {
    rawList = data.data;
  } else if (data.data && Array.isArray(data.data.data)) {
    rawList = data.data.data;
  }

  const items = dedupeAndFilter(rawList);
  const pagination = data.pagination || {};
  const hasNext = pagination.current_page && pagination.last_page
    ? pagination.current_page < pagination.last_page
    : false;

  return {
    items,
    hasNext,
    page,
  };
}

export async function getWestmangaGenres(): Promise<GenreItem[]> {
  const data = await fetchApi<any>('/westmanga/genres');
  const rawList = Array.isArray(data.data) ? data.data : [];
  return rawList
    .filter((g: any) => g?.name && (g?.id || g?.slug))
    .map((g: any) => ({
      name: String(g.name).trim(),
      slug: String(g.id || g.slug).trim(),
    }));
}

export async function getWestmangaByGenre(genreIdOrSlug: string, page: number = 1): Promise<Paged<ComicCard>> {
  const data = await fetchApi<any>(`/westmanga/genre/${encodeURIComponent(genreIdOrSlug)}?page=${page}`);
  let rawList: any[] = [];
  if (Array.isArray(data.data)) {
    rawList = data.data;
  } else if (data.data && Array.isArray(data.data.data)) {
    rawList = data.data.data;
  }

  const items = dedupeAndFilter(rawList);
  const pagination = data.pagination || {};
  const hasNext = pagination.current_page && pagination.last_page
    ? pagination.current_page < pagination.last_page
    : false;

  return {
    items,
    hasNext,
    page,
  };
}

export async function searchWestmanga(query: string, page: number = 1): Promise<Paged<ComicCard>> {
  const cleanQuery = encodeURIComponent(query.trim());
  const data = await fetchApi<any>(`/westmanga/search?q=${cleanQuery}&page=${page}`);
  let rawList: any[] = [];
  if (Array.isArray(data.data)) {
    rawList = data.data;
  } else if (data.data && Array.isArray(data.data.data)) {
    rawList = data.data.data;
  }

  const items = dedupeAndFilter(rawList);
  const pagination = data.pagination || {};
  const hasNext = pagination.current_page && pagination.last_page
    ? pagination.current_page < pagination.last_page
    : false;

  return {
    items,
    hasNext,
    page,
  };
}

export async function getWestmangaDetail(slug: string): Promise<ComicDetail> {
  const data = await fetchApi<any>(`/westmanga/detail/${encodeURIComponent(slug)}`);
  const d = data.data || {};

  const genres: string[] = [];
  if (Array.isArray(d.genres)) {
    for (const g of d.genres) {
      if (typeof g === 'string') genres.push(g.trim());
      else if (g?.name) genres.push(String(g.name).trim());
    }
  }

  const rawChapters = Array.isArray(d.chapters) ? d.chapters : [];
  let chapters: ChapterItem[] = rawChapters
    .filter((c: any) => c?.slug)
    .map((c: any) => ({
      title: c.number ? `Chapter ${c.number}` : (c.title ? String(c.title).trim() : 'Chapter'),
      slug: String(c.slug).trim(),
      date: c.updated_at?.formatted || undefined,
    }));

  return {
    title: d.title || slug,
    image: d.cover || d.image || '',
    synopsis: d.sinopsis || d.synopsis || '',
    rating: d.rating || undefined,
    status: d.status || undefined,
    type: mapCountryToType(d.country_id),
    genres,
    chapters,
  };
}

export async function getWestmangaChapter(
  comicSlug: string,
  chapterSlug: string
): Promise<ChapterPage> {
  const data = await fetchApi<any>(`/westmanga/chapter/${encodeURIComponent(chapterSlug)}`);
  const d = data.data || {};

  // Recursive search for images in chapter response
  const imageSet = new Set<string>();
  if (d.gambar) findImages(d.gambar, imageSet);
  if (d.images) findImages(d.images, imageSet);
  if (imageSet.size === 0) findImages(d, imageSet);

  const images = Array.from(imageSet);

  // Compute prev/next from chapter list
  const chaptersList: any[] = Array.isArray(d.chapters) ? d.chapters : [];
  let prevSlug: string | null = null;
  let nextSlug: string | null = null;

  if (chaptersList.length > 0) {
    const currentIndex = chaptersList.findIndex((c: any) => c.slug === chapterSlug || c.slug?.endsWith(chapterSlug));
    if (currentIndex !== -1) {
      // Westmanga chapters are typically descending:
      // index 0 = newest chapter, index N = oldest chapter
      // Earlier/previous chapter is index + 1
      // Later/next chapter is index - 1
      if (currentIndex < chaptersList.length - 1) {
        prevSlug = chaptersList[currentIndex + 1]?.slug || null;
      }
      if (currentIndex > 0) {
        nextSlug = chaptersList[currentIndex - 1]?.slug || null;
      }
    }
  }

  const title = d.title || (d.number ? `Chapter ${d.number}` : chapterSlug);

  return {
    title,
    images,
    comic: comicSlug || d.content?.slug || '',
    prev: prevSlug,
    next: nextSlug,
  };
}
