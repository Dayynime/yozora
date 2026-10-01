import { useLocation, Link } from 'react-router-dom';
import { Home, Compass, Search, BookMarked, Settings } from 'lucide-react';
import { ComicSource } from '../types/comic';
import { useSearchOverlay } from '../context/SearchOverlayContext';

interface BottomTabBarProps {
  source: ComicSource;
}

export function BottomTabBar({ source }: BottomTabBarProps) {
  const location = useLocation();
  const { openSearch } = useSearchOverlay();

  // If in reader, completely hide bottom bar
  if (location.pathname.includes('/chapter/')) {
    return null;
  }

  const isHome = location.pathname === `/${source}` || location.pathname === '/';
  const isBrowse = location.pathname.includes('/browse') || location.pathname.includes('/genres') || location.pathname.includes('/genre/');
  const isLibrary = location.pathname === '/pustaka' || location.pathname === '/bookmark' || location.pathname === '/riwayat';
  const isSettings = location.pathname === '/pengaturan';

  return (
    <nav
      aria-label="Navigasi Utama Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-line h-14 px-2 flex items-center justify-around"
    >
      {/* 1. Beranda */}
      <Link
        to={`/${source}`}
        className={`flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-2 transition-colors active:scale-95 ${
          isHome ? 'text-accent' : 'text-muted hover:text-main'
        }`}
      >
        <Home className={`w-5 h-5 ${isHome ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] font-mono mt-0.5 font-medium">Beranda</span>
      </Link>

      {/* 2. Jelajah */}
      <Link
        to={`/${source}/browse`}
        className={`flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-2 transition-colors active:scale-95 ${
          isBrowse ? 'text-accent' : 'text-muted hover:text-main'
        }`}
      >
        <Compass className={`w-5 h-5 ${isBrowse ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] font-mono mt-0.5 font-medium">Jelajah</span>
      </Link>

      {/* 3. Cari (Button that opens overlay) */}
      <button
        type="button"
        onClick={() => openSearch()}
        className="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-2 text-muted hover:text-main transition-colors active:scale-95 cursor-pointer"
      >
        <Search className="w-5 h-5 stroke-2" />
        <span className="text-[10px] font-mono mt-0.5 font-medium">Cari</span>
      </button>

      {/* 4. Pustaka (Bookmark + Riwayat) */}
      <Link
        to="/pustaka"
        className={`flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-2 transition-colors active:scale-95 ${
          isLibrary ? 'text-accent' : 'text-muted hover:text-main'
        }`}
      >
        <BookMarked className={`w-5 h-5 ${isLibrary ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] font-mono mt-0.5 font-medium">Pustaka</span>
      </Link>

      {/* 5. Pengaturan */}
      <Link
        to="/pengaturan"
        className={`flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-2 transition-colors active:scale-95 ${
          isSettings ? 'text-accent' : 'text-muted hover:text-main'
        }`}
      >
        <Settings className={`w-5 h-5 ${isSettings ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] font-mono mt-0.5 font-medium">Setelan</span>
      </Link>
    </nav>
  );
}
