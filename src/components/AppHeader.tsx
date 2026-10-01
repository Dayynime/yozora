import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { ComicSource } from '../types/comic';
import { useSearchOverlay } from '../context/SearchOverlayContext';
import { setSavedSource } from '../lib/storage';

interface AppHeaderProps {
  currentSource: ComicSource;
  title?: string;
}

export function AppHeader({ currentSource, title }: AppHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { openSearch } = useSearchOverlay();

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide when scrolling down, show when scrolling up
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (currentScrollY > lastScrollY && currentScrollY > 70) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY) {
            setIsVisible(true);
          }
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isHome = location.pathname === `/${currentSource}` || location.pathname === '/';
  const isReader = location.pathname.includes('/chapter/');

  // In reader, reader controls handle top bar
  if (isReader) return null;

  const handleSourceToggle = (newSource: ComicSource) => {
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

  return (
    <header
      className={`sticky top-0 z-30 bg-surface/95 border-b border-line transition-transform duration-200 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-6xl mx-auto h-13 px-3 sm:px-4 flex items-center justify-between gap-3">
        {/* Left: Back button or Brand */}
        <div className="flex items-center gap-2 min-w-0">
          {!isHome ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Kembali"
              className="p-2 -ml-1 text-muted hover:text-main cursor-pointer active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link to={`/${currentSource}`} className="md:hidden flex items-baseline gap-1 mr-1">
              <span className="font-serif text-xl font-bold tracking-tight text-main">Yozora</span>
              <span className="text-[10px] font-serif text-muted">夜空</span>
            </Link>
          )}

          {title && (
            <h1 className="text-sm font-semibold text-main truncate leading-tight">
              {title}
            </h1>
          )}
        </div>

        {/* Center / Right: Source switcher (Mobile only since desktop has it in sidebar) & Search */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Source Switcher Segmented Control */}
          <div className="md:hidden flex p-0.5 bg-base border border-line rounded-sm">
            <button
              type="button"
              onClick={() => handleSourceToggle('mangakita')}
              className={`px-2 py-0.5 text-[11px] font-mono rounded-sm transition-colors cursor-pointer ${
                currentSource === 'mangakita'
                  ? 'bg-accent text-white font-medium'
                  : 'text-muted hover:text-main'
              }`}
            >
              MK
            </button>
            <button
              type="button"
              onClick={() => handleSourceToggle('westmanga')}
              className={`px-2 py-0.5 text-[11px] font-mono rounded-sm transition-colors cursor-pointer ${
                currentSource === 'westmanga'
                  ? 'bg-accent text-white font-medium'
                  : 'text-muted hover:text-main'
              }`}
            >
              WM
            </button>
          </div>

          {/* Search Trigger Button */}
          <button
            type="button"
            onClick={() => openSearch()}
            aria-label="Buka pencarian"
            className="p-2 text-muted hover:text-main rounded-sm active:scale-95 transition-transform cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
