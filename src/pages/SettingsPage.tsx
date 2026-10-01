import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Moon, Sun, Database, Trash2, BookOpen, Info, Shield, Mail } from 'lucide-react';
import { ComicSource } from '../types/comic';
import {
  getSavedSource,
  setSavedSource,
  getSavedTheme,
  setSavedTheme,
  getReaderSettings,
  saveReaderSettings,
  clearHistory,
  clearSearchHistory,
  ReaderSettings,
} from '../lib/storage';
import { useToast } from '../context/ToastContext';

export function SettingsPage() {
  const [source, setSource] = useState<ComicSource>('mangakita');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [readerSettings, setReaderSettingsState] = useState<ReaderSettings>(getReaderSettings());
  const { showToast } = useToast();

  useEffect(() => {
    setSource(getSavedSource());
    setTheme(getSavedTheme());
    setReaderSettingsState(getReaderSettings());
  }, []);

  const handleSourceChange = (newSource: ComicSource) => {
    setSource(newSource);
    setSavedSource(newSource);
    showToast(`Sumber utama diubah ke ${newSource === 'mangakita' ? 'Mangakita' : 'Westmanga'}`);
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    setSavedTheme(newTheme);
  };

  const handleReaderModeChange = (mode: 'webtoon' | 'paged') => {
    const updated = { ...readerSettings, mode };
    setReaderSettingsState(updated);
    saveReaderSettings(updated);
    showToast(`Mode baca bawaan: ${mode === 'webtoon' ? 'Webtoon' : 'Halaman'}`);
  };

  const handleClearHistory = () => {
    if (window.confirm('Hapus seluruh riwayat bacaan Anda?')) {
      clearHistory();
      showToast('Riwayat baca telah dikosongkan');
    }
  };

  const handleClearSearches = () => {
    clearSearchHistory();
    showToast('Riwayat pencarian telah dibersihkan');
  };

  return (
    <>
      <Helmet>
        <title>Pengaturan — Yozora</title>
        <meta name="description" content="Pengaturan preferensi pembaca dan tampilan aplikasi Yozora." />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        <div className="border-b border-line pb-3">
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-main">
            Pengaturan Aplikasi
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            Sesuaikan preferensi membaca, tampilan, dan penyimpanan lokal.
          </p>
        </div>

        {/* Section 1: Sumber Komik */}
        <section className="bg-surface border border-line p-4 rounded-sm space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-main">
              Sumber Data Komik
            </h2>
          </div>
          <p className="text-xs text-muted">
            Pilih penyedia data komik utama. Keduanya memiliki katalog dan kecepatan pembaruan yang berbeda.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleSourceChange('mangakita')}
              className={`p-3 rounded-sm border text-left font-mono transition-colors cursor-pointer ${
                source === 'mangakita'
                  ? 'bg-base border-accent text-accent font-bold'
                  : 'bg-base border-line text-muted hover:text-main'
              }`}
            >
              <span className="block text-sm font-semibold">Mangakita</span>
              <span className="text-[10px] text-muted block mt-0.5">Katalog luas manga & manhwa</span>
            </button>

            <button
              type="button"
              onClick={() => handleSourceChange('westmanga')}
              className={`p-3 rounded-sm border text-left font-mono transition-colors cursor-pointer ${
                source === 'westmanga'
                  ? 'bg-base border-accent text-accent font-bold'
                  : 'bg-base border-line text-muted hover:text-main'
              }`}
            >
              <span className="block text-sm font-semibold">Westmanga</span>
              <span className="text-[10px] text-muted block mt-0.5">Spesialis manhwa & komik berwarna</span>
            </button>
          </div>
        </section>

        {/* Section 2: Tema Tampilan */}
        <section className="bg-surface border border-line p-4 rounded-sm space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-main">
              Tema Tampilan
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`p-3 rounded-sm border text-left font-mono transition-colors cursor-pointer flex items-center justify-between ${
                theme === 'dark'
                  ? 'bg-base border-accent text-accent font-bold'
                  : 'bg-base border-line text-muted hover:text-main'
              }`}
            >
              <div>
                <span className="block text-sm font-semibold">Gelap (Default)</span>
                <span className="text-[10px] text-muted">Latar hitam netral (#121212)</span>
              </div>
              <Moon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`p-3 rounded-sm border text-left font-mono transition-colors cursor-pointer flex items-center justify-between ${
                theme === 'light'
                  ? 'bg-base border-accent text-accent font-bold'
                  : 'bg-base border-line text-muted hover:text-main'
              }`}
            >
              <div>
                <span className="block text-sm font-semibold">Kertas Hangat</span>
                <span className="text-[10px] text-muted">Latar krem lembut (#f5f2ec)</span>
              </div>
              <Sun className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Section 3: Pengaturan Pembaca Bawaan */}
        <section className="bg-surface border border-line p-4 rounded-sm space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-main">
              Mode Pembaca Bawaan
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleReaderModeChange('webtoon')}
              className={`p-2.5 rounded-sm border text-center font-mono transition-colors cursor-pointer ${
                readerSettings.mode === 'webtoon'
                  ? 'bg-base border-accent text-accent font-bold'
                  : 'bg-base border-line text-muted hover:text-main'
              }`}
            >
              Webtoon (Gulir Vertikal)
            </button>

            <button
              type="button"
              onClick={() => handleReaderModeChange('paged')}
              className={`p-2.5 rounded-sm border text-center font-mono transition-colors cursor-pointer ${
                readerSettings.mode === 'paged'
                  ? 'bg-base border-accent text-accent font-bold'
                  : 'bg-base border-line text-muted hover:text-main'
              }`}
            >
              Halaman (Geser Layar)
            </button>
          </div>
        </section>

        {/* Section 4: Manajemen Penyimpanan Lokal */}
        <section className="bg-surface border border-line p-4 rounded-sm space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-main">
              Penyimpanan Lokal (localStorage)
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleClearHistory}
              className="flex-1 py-2 px-3 bg-base border border-line hover:border-accent text-xs font-mono text-muted hover:text-accent rounded-sm transition-colors cursor-pointer text-center"
            >
              Kosongkan Riwayat Baca
            </button>

            <button
              type="button"
              onClick={handleClearSearches}
              className="flex-1 py-2 px-3 bg-base border border-line hover:border-accent text-xs font-mono text-muted hover:text-accent rounded-sm transition-colors cursor-pointer text-center"
            >
              Hapus Riwayat Cari
            </button>
          </div>
        </section>

        {/* Section 5: Informasi & Tautan */}
        <section className="bg-surface border border-line p-4 rounded-sm divide-y divide-line text-xs font-mono">
          <Link
            to="/about"
            className="py-2.5 flex items-center justify-between text-muted hover:text-main transition-colors"
          >
            <span className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5" />
              <span>Tentang Yozora</span>
            </span>
            <span>→</span>
          </Link>

          <Link
            to="/privacy"
            className="py-2.5 flex items-center justify-between text-muted hover:text-main transition-colors"
          >
            <span className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Kebijakan Privasi</span>
            </span>
            <span>→</span>
          </Link>

          <Link
            to="/contact"
            className="py-2.5 flex items-center justify-between text-muted hover:text-main transition-colors"
          >
            <span className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              <span>Kontak & Bantuan</span>
            </span>
            <span>→</span>
          </Link>
        </section>
      </div>
    </>
  );
}
