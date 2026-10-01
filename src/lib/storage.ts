import { BookmarkItem, ComicSource, HistoryItem } from '../types/comic';

const SOURCE_KEY = 'yozora_source';
const THEME_KEY = 'yozora_theme';
const BOOKMARKS_KEY = 'yozora_bookmarks';
const HISTORY_KEY = 'yozora_history';
const CONTINUE_KEY = 'yozora_continue';
const SEARCH_HISTORY_KEY = 'yozora_search_history';
const READER_SETTINGS_KEY = 'yozora_reader_settings';

export interface ReaderSettings {
  mode: 'webtoon' | 'paged';
  direction: 'ltr' | 'rtl'; // For paged mode
  maxWidth: 'full' | '800px' | '600px';
  background: 'black' | 'dark' | 'soft'; // #000000, #121212, #1c1c1c
  gap: 'none' | 'small' | 'normal'; // 0px, 4px, 8px
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  mode: 'webtoon',
  direction: 'ltr',
  maxWidth: '800px',
  background: 'black',
  gap: 'none',
};

export function getSavedSource(): ComicSource {
  try {
    const val = localStorage.getItem(SOURCE_KEY);
    if (val === 'westmanga' || val === 'mangakita') return val;
  } catch {
    // ignore
  }
  return 'mangakita';
}

export function setSavedSource(source: ComicSource) {
  try {
    localStorage.setItem(SOURCE_KEY, source);
    window.dispatchEvent(new Event('yozora_source_change'));
  } catch {
    // ignore
  }
}

export function getSavedTheme(): 'dark' | 'light' {
  try {
    const val = localStorage.getItem(THEME_KEY);
    if (val === 'light' || val === 'dark') return val;
  } catch {
    // ignore
  }
  return 'dark';
}

export function setSavedTheme(theme: 'dark' | 'light') {
  try {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    window.dispatchEvent(new Event('yozora_theme_change'));
  } catch {
    // ignore
  }
}

export function getBookmarks(): BookmarkItem[] {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function isBookmarked(comicSlug: string, src: ComicSource): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.comicSlug === comicSlug && b.src === src);
}

export function toggleBookmark(item: Omit<BookmarkItem, 'addedAt'>): boolean {
  try {
    let bookmarks = getBookmarks();
    const exists = bookmarks.some(b => b.comicSlug === item.comicSlug && b.src === item.src);
    if (exists) {
      bookmarks = bookmarks.filter(b => !(b.comicSlug === item.comicSlug && b.src === item.src));
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      window.dispatchEvent(new Event('yozora_bookmark_change'));
      return false;
    } else {
      bookmarks.unshift({ ...item, addedAt: Date.now() });
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      window.dispatchEvent(new Event('yozora_bookmark_change'));
      return true;
    }
  } catch {
    return false;
  }
}

export function removeBookmark(comicSlug: string, src: ComicSource) {
  try {
    const bookmarks = getBookmarks().filter(b => !(b.comicSlug === comicSlug && b.src === src));
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    window.dispatchEvent(new Event('yozora_bookmark_change'));
  } catch {
    // ignore
  }
}

export function getHistory(): HistoryItem[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveHistory(entry: Omit<HistoryItem, 'readAt'>) {
  try {
    let history = getHistory();
    history = history.filter(h => !(h.comicSlug === entry.comicSlug && h.src === entry.src));
    history.unshift({
      ...entry,
      readAt: Date.now(),
    });
    if (history.length > 100) history = history.slice(0, 100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event('yozora_history_change'));
  } catch {
    // ignore
  }
}

export function deleteHistoryItem(comicSlug: string, src: ComicSource) {
  try {
    const history = getHistory().filter(h => !(h.comicSlug === comicSlug && h.src === src));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event('yozora_history_change'));
  } catch {
    // ignore
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new Event('yozora_history_change'));
  } catch {
    // ignore
  }
}

export interface ContinueReadingData {
  comicSlug: string;
  comicTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  src: ComicSource;
  scrollY: number;
  image?: string;
  updatedAt: number;
}

export function getContinueReading(comicSlug?: string, src?: ComicSource): ContinueReadingData | null {
  try {
    const raw = localStorage.getItem(CONTINUE_KEY);
    if (!raw) return null;
    const map: Record<string, ContinueReadingData> = JSON.parse(raw);
    if (comicSlug && src) {
      return map[`${src}:${comicSlug}`] || null;
    }
    const items = Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
    return items[0] || null;
  } catch {
    return null;
  }
}

export function getAllContinueReading(): ContinueReadingData[] {
  try {
    const raw = localStorage.getItem(CONTINUE_KEY);
    if (!raw) return [];
    const map: Record<string, ContinueReadingData> = JSON.parse(raw);
    return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveContinueReading(data: Omit<ContinueReadingData, 'updatedAt'>) {
  try {
    const raw = localStorage.getItem(CONTINUE_KEY);
    const map: Record<string, ContinueReadingData> = raw ? JSON.parse(raw) : {};
    const key = `${data.src}:${data.comicSlug}`;
    map[key] = {
      ...data,
      updatedAt: Date.now(),
    };
    localStorage.setItem(CONTINUE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

// Search History
export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string) {
  const q = query.trim();
  if (!q) return;
  try {
    let list = getSearchHistory();
    list = list.filter(item => item.toLowerCase() !== q.toLowerCase());
    list.unshift(q);
    if (list.length > 10) list = list.slice(0, 10);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function removeSearchHistory(query: string) {
  try {
    const list = getSearchHistory().filter(item => item !== query);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // ignore
  }
}

// Reader Settings per Comic / Global
export function getReaderSettings(comicSlug?: string): ReaderSettings {
  try {
    const raw = localStorage.getItem(READER_SETTINGS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    if (comicSlug && map[comicSlug]) {
      return { ...DEFAULT_READER_SETTINGS, ...map[comicSlug] };
    }
    if (map['__global__']) {
      return { ...DEFAULT_READER_SETTINGS, ...map['__global__'] };
    }
  } catch {
    // ignore
  }
  return DEFAULT_READER_SETTINGS;
}

export function saveReaderSettings(settings: Partial<ReaderSettings>, comicSlug?: string) {
  try {
    const raw = localStorage.getItem(READER_SETTINGS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const key = comicSlug || '__global__';
    map[key] = { ...DEFAULT_READER_SETTINGS, ...(map[key] || {}), ...settings };
    localStorage.setItem(READER_SETTINGS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}
