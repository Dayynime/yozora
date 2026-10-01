import { X, SlidersHorizontal } from 'lucide-react';
import { ReaderSettings } from '../lib/storage';

interface ReaderSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onChange: (newSettings: Partial<ReaderSettings>) => void;
}

export function ReaderSettingsSheet({
  isOpen,
  onClose,
  settings,
  onChange,
}: ReaderSettingsSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 animate-in fade-in duration-150">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="w-full max-w-md mx-auto bg-surface border-t border-line rounded-t-md p-4 sm:p-5 max-h-[80vh] flex flex-col space-y-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-accent" />
            <h3 className="font-serif text-base font-bold text-main">Pengaturan Pembaca</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1 text-muted hover:text-main cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-mono">
          {/* Mode Baca: Webtoon (Scroll) vs Halaman (Paged) */}
          <div className="space-y-1.5">
            <label className="text-muted uppercase tracking-wider block">Mode Baca</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ mode: 'webtoon' })}
                className={`p-2.5 rounded-sm border text-center transition-colors cursor-pointer ${
                  settings.mode === 'webtoon'
                    ? 'bg-base border-accent text-accent font-semibold'
                    : 'bg-base border-line text-muted hover:text-main'
                }`}
              >
                Webtoon (Gulir)
              </button>
              <button
                type="button"
                onClick={() => onChange({ mode: 'paged' })}
                className={`p-2.5 rounded-sm border text-center transition-colors cursor-pointer ${
                  settings.mode === 'paged'
                    ? 'bg-base border-accent text-accent font-semibold'
                    : 'bg-base border-line text-muted hover:text-main'
                }`}
              >
                Halaman (Geser)
              </button>
            </div>
          </div>

          {/* Direction for Paged mode */}
          {settings.mode === 'paged' && (
            <div className="space-y-1.5">
              <label className="text-muted uppercase tracking-wider block">Arah Baca</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ direction: 'ltr' })}
                  className={`p-2 rounded-sm border text-center transition-colors cursor-pointer ${
                    settings.direction === 'ltr'
                      ? 'bg-base border-accent text-accent font-semibold'
                      : 'bg-base border-line text-muted hover:text-main'
                  }`}
                >
                  Kiri → Kanan
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ direction: 'rtl' })}
                  className={`p-2 rounded-sm border text-center transition-colors cursor-pointer ${
                    settings.direction === 'rtl'
                      ? 'bg-base border-accent text-accent font-semibold'
                      : 'bg-base border-line text-muted hover:text-main'
                  }`}
                >
                  Kanan → Kiri (Manga)
                </button>
              </div>
            </div>
          )}

          {/* Lebar Gambar */}
          <div className="space-y-1.5">
            <label className="text-muted uppercase tracking-wider block">Lebar Gambar</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onChange({ maxWidth: '600px' })}
                className={`p-2 rounded-sm border text-center transition-colors cursor-pointer ${
                  settings.maxWidth === '600px'
                    ? 'bg-base border-accent text-accent font-semibold'
                    : 'bg-base border-line text-muted hover:text-main'
                }`}
              >
                Kecil (600px)
              </button>
              <button
                type="button"
                onClick={() => onChange({ maxWidth: '800px' })}
                className={`p-2 rounded-sm border text-center transition-colors cursor-pointer ${
                  settings.maxWidth === '800px'
                    ? 'bg-base border-accent text-accent font-semibold'
                    : 'bg-base border-line text-muted hover:text-main'
                }`}
              >
                Sedang (800px)
              </button>
              <button
                type="button"
                onClick={() => onChange({ maxWidth: 'full' })}
                className={`p-2 rounded-sm border text-center transition-colors cursor-pointer ${
                  settings.maxWidth === 'full'
                    ? 'bg-base border-accent text-accent font-semibold'
                    : 'bg-base border-line text-muted hover:text-main'
                }`}
              >
                Penuh Layar
              </button>
            </div>
          </div>

          {/* Kecerahan Latar */}
          <div className="space-y-1.5">
            <label className="text-muted uppercase tracking-wider block">Kecerahan Latar</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onChange({ background: 'black' })}
                className={`p-2 rounded-sm border text-center transition-colors cursor-pointer ${
                  settings.background === 'black'
                    ? 'bg-[#000000] border-accent text-accent font-semibold'
                    : 'bg-[#000000] border-line text-muted hover:text-white'
                }`}
              >
                Hitam Pekat
              </button>
              <button
                type="button"
                onClick={() => onChange({ background: 'dark' })}
                className={`p-2 rounded-sm border text-center transition-colors cursor-pointer ${
                  settings.background === 'dark'
                    ? 'bg-[#121212] border-accent text-accent font-semibold'
                    : 'bg-[#121212] border-line text-muted hover:text-white'
                }`}
              >
                Gelap Netral
              </button>
              <button
                type="button"
                onClick={() => onChange({ background: 'soft' })}
                className={`p-2 rounded-sm border text-center transition-colors cursor-pointer ${
                  settings.background === 'soft'
                    ? 'bg-[#1c1c1c] border-accent text-accent font-semibold'
                    : 'bg-[#1c1c1c] border-line text-muted hover:text-white'
                }`}
              >
                Abu Lembut
              </button>
            </div>
          </div>

          {/* Jarak Antar Gambar (Webtoon mode only) */}
          {settings.mode === 'webtoon' && (
            <div className="space-y-1.5">
              <label className="text-muted uppercase tracking-wider block">Jarak Gambar</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ gap: 'none' })}
                  className={`p-2 rounded-sm border text-center transition-colors cursor-pointer ${
                    settings.gap === 'none'
                      ? 'bg-base border-accent text-accent font-semibold'
                      : 'bg-base border-line text-muted hover:text-main'
                  }`}
                >
                  Rapat (0px)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ gap: 'small' })}
                  className={`p-2 rounded-sm border text-center transition-colors cursor-pointer ${
                    settings.gap === 'small'
                      ? 'bg-base border-accent text-accent font-semibold'
                      : 'bg-base border-line text-muted hover:text-main'
                  }`}
                >
                  Sedang (4px)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ gap: 'normal' })}
                  className={`p-2 rounded-sm border text-center transition-colors cursor-pointer ${
                    settings.gap === 'normal'
                      ? 'bg-base border-accent text-accent font-semibold'
                      : 'bg-base border-line text-muted hover:text-main'
                  }`}
                >
                  Lega (8px)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
