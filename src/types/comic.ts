export type ComicSource = 'mangakita' | 'westmanga';

export interface ComicCard {
  title: string;
  slug: string;
  image: string;
  rating?: string | number;
  type?: string; // Manga, Manhwa, Manhua, Komik
  latest?: string; // e.g. "Ch. 142"
  updatedAt?: string; // e.g. "2 jam lalu"
}

export interface ChapterItem {
  title: string;
  slug: string;
  date?: string;
}

export interface ComicDetail {
  title: string;
  image: string;
  synopsis: string;
  rating?: string | number;
  status?: string;
  type?: string;
  genres: string[];
  chapters: ChapterItem[];
}

export interface ChapterPage {
  title: string;
  images: string[];
  comic: string;
  prev?: string | null;
  next?: string | null;
  debugCandidates?: string[];
}

export interface Paged<T> {
  sections?: { name: string; items: T[] }[];
  items?: T[];
  hasNext: boolean;
  page?: number;
}

export interface GenreItem {
  name: string;
  slug: string;
}

export interface BookmarkItem {
  comicSlug: string;
  title: string;
  image: string;
  type?: string;
  src: ComicSource;
  latestChapter?: string;
  addedAt: number;
}

export interface HistoryItem {
  comicSlug: string;
  comicTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  image?: string;
  src: ComicSource;
  scrollY?: number;
  readAt: number;
}
