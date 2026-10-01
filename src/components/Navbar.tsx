import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ComicSource } from '../types/comic';
import { getSavedTheme, setSavedTheme, setSavedSource } from '../lib/storage';

interface NavbarProps {
  currentSource: ComicSource;
}

export function Navbar({ currentSource }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setTheme(getSavedTheme());
    const onThemeChange = () => setTheme(getSavedTheme());
    window.addEventListener('yozora_theme_change', onThemeChange);
    return () => window.removeEventListener('yozora_theme_change', onThemeChange);
  }, []);

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSource = e.target.value as ComicSource;
    setSavedSource(newSource);

    // If currently on a source-specific path, replace source prefix
    const path = location.pathname;
    if (path.startsWith(`/${currentSource}`)) {
      const rest = path.slice(currentSource.length + 1);
      navigate(`/${newSource}${rest}${location.search}`);
    } else {
      navigate(`/${newSource}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/${currentSource}/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setIsMobileMenuOpen(false);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setSavedTheme(next);
  };

  return (
    <header className="sticky top-0 z-40 bg-base border-b border-line">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-13 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={`/${currentSource}`}
            className="flex items-baseline gap-1.5 text-main hover:text-accent transition-colors"
          >
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
              Yozora
            </span>
            <span className="text-[11px] font-serif text-muted tracking-widest">
              夜空
            </span>
          </Link>

          {/* Source Selector */}
          <div className="relative">
            <select
              value={currentSource}
              onChange={handleSourceChange}
              aria-label="Pilih Sumber Komik"
              className="bg-surface text-main border border-line text-xs font-mono py-1 px-2 rounded-sm focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              <option value="mangakita">Mangakita</option>
              <option value="westmanga">Westmanga</option>
            </select>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-muted">
          <Link
            to={`/${currentSource}`}
            className={`hover:text-main transition-colors ${
              location.pathname === `/${currentSource}` ? 'text-accent' : ''
            }`}
          >
            Beranda
          </Link>
          <Link
            to={`/${currentSource}/browse/latest`}
            className={`hover:text-main transition-colors ${
              location.pathname.includes('/browse/latest') ? 'text-accent' : ''
            }`}
          >
            Terbaru
          </Link>
          <Link
            to={`/${currentSource}/browse/popular`}
            className={`hover:text-main transition-colors ${
              location.pathname.includes('/browse/popular') ? 'text-accent' : ''
            }`}
          >
            Populer
          </Link>
          <Link
            to={`/${currentSource}/browse/projects`}
            className={`hover:text-main transition-colors ${
              location.pathname.includes('/browse/projects') ? 'text-accent' : ''
            }`}
          >
            Project
          </Link>
          <Link
            to={`/${currentSource}/genres`}
            className={`hover:text-main transition-colors ${
              location.pathname.includes('/genre') ? 'text-accent' : ''
            }`}
          >
            Genre
          </Link>
          <Link
            to="/bookmark"
            className={`hover:text-main transition-colors ${
              location.pathname === '/bookmark' ? 'text-accent' : ''
            }`}
          >
            Bookmark
          </Link>
          <Link
            to="/riwayat"
            className={`hover:text-main transition-colors ${
              location.pathname === '/riwayat' ? 'text-accent' : ''
            }`}
          >
            Riwayat
          </Link>
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-40 md:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul..."
              className="w-full bg-surface border border-line text-xs text-main placeholder-muted px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </form>

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            type="button"
            title={theme === 'dark' ? 'Ganti ke tema Terang' : 'Ganti ke tema Gelap'}
            className="text-xs font-mono px-2 py-1 bg-surface border border-line text-muted hover:text-main rounded-sm transition-colors cursor-pointer"
          >
            {theme === 'dark' ? 'TERANG' : 'GELAP'}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            type="button"
            className="md:hidden text-xs font-mono px-2 py-1 bg-surface border border-line text-main rounded-sm cursor-pointer"
          >
            {isMobileMenuOpen ? 'TUTUP' : 'MENU'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Clean, Non-floating, Plain Text) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-surface px-4 py-3 space-y-3">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul komik..."
              className="w-full bg-base border border-line text-xs text-main placeholder-muted px-3 py-2 rounded-sm focus:outline-none focus:border-accent"
            />
          </form>

          <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-1">
            <Link
              to={`/${currentSource}`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-main hover:text-accent"
            >
              Beranda
            </Link>
            <Link
              to={`/${currentSource}/browse/latest`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-main hover:text-accent"
            >
              Update Terbaru
            </Link>
            <Link
              to={`/${currentSource}/browse/popular`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-main hover:text-accent"
            >
              Komik Populer
            </Link>
            <Link
              to={`/${currentSource}/browse/projects`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-main hover:text-accent"
            >
              Project Rilis
            </Link>
            <Link
              to={`/${currentSource}/genres`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-main hover:text-accent"
            >
              Daftar Genre
            </Link>
            <Link
              to="/bookmark"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-main hover:text-accent"
            >
              Bookmark Tersimpan
            </Link>
            <Link
              to="/riwayat"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-main hover:text-accent"
            >
              Riwayat Baca
            </Link>
            <Link
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 text-muted hover:text-main"
            >
              Tentang Kami
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
