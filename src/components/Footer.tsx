import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-line mt-12 bg-base">
      <div className="max-w-6xl mx-auto px-4 py-8 text-xs text-muted">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-main">Yozora</span>
            <span className="text-[11px] font-serif text-muted">夜空</span>
            <span className="text-subtle">·</span>
            <span>Baca komik online, bahasa Indonesia.</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link to="/about" className="hover:text-main transition-colors">
              Tentang
            </Link>
            <span className="text-subtle">·</span>
            <Link to="/privacy" className="hover:text-main transition-colors">
              Privasi
            </Link>
            <span className="text-subtle">·</span>
            <Link to="/contact" className="hover:text-main transition-colors">
              Kontak
            </Link>
          </div>
        </div>

        <div className="pt-4 text-subtle text-[11px] leading-relaxed">
          <p>
            Yozora tidak menyimpan file di server. Konten berasal dari pihak ketiga. Hak cipta milik pengarang dan penerbit asli masing-masing karya.
          </p>
        </div>
      </div>
    </footer>
  );
}
