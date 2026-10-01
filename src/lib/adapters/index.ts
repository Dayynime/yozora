import {
  ChapterPage,
  ComicCard,
  ComicDetail,
  ComicSource,
  GenreItem,
  Paged,
} from '../../types/comic';
import {
  getMangakitaBrowse,
  getMangakitaByGenre,
  getMangakitaChapter,
  getMangakitaDetail,
  getMangakitaGenres,
  getMangakitaHome,
  searchMangakita,
} from './mangakita';
import {
  getWestmangaBrowse,
  getWestmangaByGenre,
  getWestmangaChapter,
  getWestmangaDetail,
  getWestmangaGenres,
  getWestmangaHome,
  searchWestmanga,
} from './westmanga';

export interface HomeData {
  featured: ComicCard[];
  latest: ComicCard[];
  popular: ComicCard[];
  projects: ComicCard[];
  extra?: { title: string; items: ComicCard[] };
}

export async function getUnifiedHome(source: ComicSource): Promise<HomeData> {
  if (source === 'westmanga') {
    const data = await getWestmangaHome();
    const featured = data.popular.slice(0, 3);
    return {
      featured,
      latest: data.mirrorUpdate,
      popular: data.popular,
      projects: data.projectUpdate,
      extra: data.newProject.length > 0 ? { title: 'Komik Baru', items: data.newProject } : undefined,
    };
  }

  // default: mangakita
  const data = await getMangakitaHome();
  const featured = data.popularToday.slice(0, 3);
  return {
    featured,
    latest: data.latestReleases,
    popular: data.popularToday,
    projects: data.projectUpdates,
  };
}

export async function getUnifiedBrowse(
  source: ComicSource,
  kind: string,
  page: number = 1
): Promise<Paged<ComicCard>> {
  if (source === 'westmanga') {
    return getWestmangaBrowse(kind, page);
  }
  return getMangakitaBrowse(kind, page);
}

export async function getUnifiedGenres(source: ComicSource): Promise<GenreItem[]> {
  if (source === 'westmanga') {
    return getWestmangaGenres();
  }
  return getMangakitaGenres();
}

export async function getUnifiedByGenre(
  source: ComicSource,
  slug: string,
  page: number = 1
): Promise<Paged<ComicCard>> {
  if (source === 'westmanga') {
    return getWestmangaByGenre(slug, page);
  }
  return getMangakitaByGenre(slug, page);
}

export async function searchUnified(
  source: ComicSource,
  query: string,
  page: number = 1
): Promise<Paged<ComicCard>> {
  if (source === 'westmanga') {
    return searchWestmanga(query, page);
  }
  return searchMangakita(query, page);
}

export async function getUnifiedDetail(source: ComicSource, slug: string): Promise<ComicDetail> {
  if (source === 'westmanga') {
    return getWestmangaDetail(slug);
  }
  return getMangakitaDetail(slug);
}

export async function getUnifiedChapter(
  source: ComicSource,
  comicSlug: string,
  chapterSlug: string,
  debug: boolean = false
): Promise<ChapterPage> {
  if (source === 'westmanga') {
    return getWestmangaChapter(comicSlug, chapterSlug);
  }
  return getMangakitaChapter(comicSlug, chapterSlug, debug);
}
