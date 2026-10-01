import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, Search, BookMarked, Settings, Moon, Sun } from 'lucide-react';
import { ComicSource } from '../types/comic';
import { useSearchOverlay } from '../context/SearchOverlayContext';
import { getSavedTheme, setSavedTheme, setSavedSource } from '../lib/storage';
import { useState, useEffect } from 'react';

interface DesktopSidebarProps {
  currentSource: ComicSource;
}

export function DesktopSidebar({ currentSource }: DesktopSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { openSearch } = useSearchOverlay();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setTheme(getSavedTheme());
    const onThemeChange = () => setTheme(getSavedTheme());
    window.addEventListener('yozora_theme_change', onThemeChange);
    return () => window.removeEventListener('yozora_theme_change', onThemeChange);
  }, []);

  const handleSourceSelect = (newSource: ComicSource) => {
    if (newSource === currentSource) return;
    setSavedSource(newSource);
    const path = location.pathname;
    if (path.startsWith(`/${currentSource}`)) {
      const rest = path.slice(currentSource.length + 1);
      navigate(`/${newSource}${rest}${location.search}`);
    } else {
      navigate(`/${newSource}`);
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setSavedTheme(next);
  };

  const isHome = location.pathname === `/${currentSource}` || location.pathname === '/';
  const isBrowse = location.pathname.includes('/browse') || location.pathname.includes('/genres') || location.pathname.includes('/genre/');
  const isLibrary = location.pathname === '/pustaka' || location.pathname === '/bookmark' || location.pathname === '/riwayat';
  const isSettings = location.pathname === '/pengaturan';

  return (
    <aside className="hidden md:flex flex-col w-56 fixed left-0 top-0 bottom-0 z-30 bg-surface border-r border-line p-4 justify-between">
      <div className="space-y-6">
        {/* Brand */}
        <Link
          to={`/${currentSource}`}
          className="flex items-baseline gap-1.5 text-main hover:text-accent transition-colors px-2"
        >
          <span className="font-serif text-2xl font-bold tracking-tight">Yozora</span>
          <span className="text-xs font-serif text-muted tracking-widest">夜空</span>
        </Link>

        {/* Source Segmented Control */}
        <div className="space-y-1.5 px-1">
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
            Sumber Data
          </span>
          <div className="grid grid-cols-2 p-0.5 bg-base border border-line rounded-sm">
            <button
              type="button"
              onClick={() => handleSourceSelect('mangakita')}
              className={`py-1 text-xs font-mono rounded-sm transition-colors cursor-pointer ${
                currentSource === 'mangakita'
                  ? 'bg-accent text-white font-medium'
                  : 'text-muted hover:text-main'
              }`}
            >
              Mangakita
            </button>
            <button
              type="button"
              onClick={() => handleSourceSelect('westmanga')}
              className={`py-1 text-xs font-mono rounded-sm transition-colors cursor-pointer ${
                currentSource === 'westmanga'
                  ? 'bg-accent text-white font-medium'
                  : 'text-muted hover:text-main'
              }`}
            >
              Westmanga
            </button>
          </div>
        </div>

        {/* Main Nav Links */}
        <nav className="space-y-1">
          <Link
            to={`/${currentSource}`}
            className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-sm transition-colors ${
              isHome ? 'bg-base text-accent font-semibold border border-line' : 'text-muted hover:text-main hover:bg-base/50'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Beranda</span>
          </Link>

          <Link
            to={`/${currentSource}/browse`}
            className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-sm transition-colors ${
              isBrowse ? 'bg-base text-accent font-semibold border border-line' : 'text-muted hover:text-main hover:bg-base/50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Jelajah</span>
          </Link>

          <button
            type="button"
            onClick={() => openSearch()}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted hover:text-main hover:bg-base/50 rounded-sm transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Cari Komik</span>
          </button>

          <Link
            to="/pustaka"
            className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-sm transition-colors ${
              isLibrary ? 'bg-base text-accent font-semibold border border-line' : 'text-muted hover:text-main hover:bg-base/50'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Pustaka</span>
          </Link>

          <Link
            to="/pengaturan"
            className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-sm transition-colors ${
              isSettings ? 'bg-base text-accent font-semibold border border-line' : 'text-muted hover:text-main hover:bg-base/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan</span>
          </Link>
        </nav>
      </div>

      {/* Bottom Controls: Theme Toggle & Info */}
      <div className="border-t border-line pt-4 space-y-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono bg-base border border-line text-muted hover:text-main rounded-sm transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-accent" /> : <Sun className="w-3.5 h-3.5 text-accent" />}
            {theme === 'dark' ? 'Tema Gelap' : 'Tema Terang'}
          </span>
          <span className="text-[10px] uppercase font-bold text-accent">Ganti</span>
        </button>

        <div className="px-2 text-[11px] text-subtle font-mono">
          <p>Yozora v2.0</p>
        </div>
      </div>
    </aside>
  );
}
