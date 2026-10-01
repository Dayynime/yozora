import { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ComicSource } from './types/comic';
import { getSavedSource, getSavedTheme, setSavedSource } from './lib/storage';
import { DesktopSidebar } from './components/DesktopSidebar';
import { BottomTabBar } from './components/BottomTabBar';
import { AppHeader } from './components/AppHeader';
import { SearchOverlay } from './components/SearchOverlay';
import { ToastContainer } from './components/Toast';
import { OfflineBanner } from './components/OfflineBanner';
import { ToastProvider } from './context/ToastContext';
import { SearchOverlayProvider } from './context/SearchOverlayContext';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { GenresPage } from './pages/GenresPage';
import { GenreDetailPage } from './pages/GenreDetailPage';
import { DetailPage } from './pages/DetailPage';
import { ReaderPage } from './pages/ReaderPage';
import { LibraryPage } from './pages/LibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage, PrivacyPage, ContactPage } from './pages/StaticPages';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RootRedirect() {
  const source = getSavedSource();
  return <Navigate to={`/${source}`} replace />;
}

// Scroll restoration helper
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // If navigating to reader or new page, reset scroll
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Layout wrapper for app pages (desktop sidebar + mobile bottom tab bar + app header)
function AppShell() {
  const { src } = useParams<{ src: string }>();
  const validSource: ComicSource =
    src === 'westmanga' || src === 'mangakita' ? src : getSavedSource();

  useEffect(() => {
    if (src && (src === 'westmanga' || src === 'mangakita')) {
      setSavedSource(src);
    }
  }, [src]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-base text-main selection:bg-accent selection:text-white">
      {/* Desktop Left Sidebar */}
      <DesktopSidebar currentSource={validSource} />

      {/* Main Content Column */}
      <div className="flex-1 md:pl-56 flex flex-col min-w-0 min-h-screen">
        <OfflineBanner />
        <AppHeader currentSource={validSource} />

        <main className="flex-1 max-w-[1200px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <Outlet />
        </main>

        {/* Mobile Bottom Tab Bar (fixed) */}
        <BottomTabBar source={validSource} />
      </div>

      <ToastContainer />
      <SearchOverlay />
    </div>
  );
}

// Page wrappers that extract `src`
function SourceHome() {
  const { src } = useParams<{ src: string }>();
  const source: ComicSource = src === 'westmanga' ? 'westmanga' : 'mangakita';
  return <HomePage source={source} />;
}

function SourceBrowse() {
  const { src } = useParams<{ src: string }>();
  const source: ComicSource = src === 'westmanga' ? 'westmanga' : 'mangakita';
  return <BrowsePage source={source} />;
}

function SourceGenres() {
  const { src } = useParams<{ src: string }>();
  const source: ComicSource = src === 'westmanga' ? 'westmanga' : 'mangakita';
  return <GenresPage source={source} />;
}

function SourceGenreDetail() {
  const { src } = useParams<{ src: string }>();
  const source: ComicSource = src === 'westmanga' ? 'westmanga' : 'mangakita';
  return <GenreDetailPage source={source} />;
}

function SourceDetail() {
  const { src } = useParams<{ src: string }>();
  const source: ComicSource = src === 'westmanga' ? 'westmanga' : 'mangakita';
  return <DetailPage source={source} />;
}

function ReaderRoute() {
  const { src } = useParams<{ src: string }>();
  const source: ComicSource = src === 'westmanga' ? 'westmanga' : 'mangakita';

  useEffect(() => {
    if (src && (src === 'westmanga' || src === 'mangakita')) {
      setSavedSource(src);
    }
  }, [src]);

  return <ReaderPage source={source} />;
}

export default function App() {
  useEffect(() => {
    const savedTheme = getSavedTheme();
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ToastProvider>
          <SearchOverlayProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                {/* Root redirect */}
                <Route path="/" element={<RootRedirect />} />

                {/* Reader Route: Outside normal AppShell, zero distraction */}
                <Route path="/:src/chapter/:comic/*" element={<ReaderRoute />} />

                {/* AppShell routes */}
                <Route element={<AppShell />}>
                  {/* Source routes */}
                  <Route path="/:src" element={<SourceHome />} />
                  <Route path="/:src/browse" element={<SourceBrowse />} />
                  <Route path="/:src/browse/:kind" element={<SourceBrowse />} />
                  <Route path="/:src/genres" element={<SourceGenres />} />
                  <Route path="/:src/genre/:slug" element={<SourceGenreDetail />} />
                  <Route path="/:src/detail/:slug" element={<SourceDetail />} />

                  {/* Unified Library route & redirects */}
                  <Route path="/pustaka" element={<LibraryPage />} />
                  <Route path="/bookmark" element={<Navigate to="/pustaka" replace />} />
                  <Route path="/riwayat" element={<Navigate to="/pustaka" replace />} />

                  {/* Settings & Info */}
                  <Route path="/pengaturan" element={<SettingsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/contact" element={<ContactPage />} />

                  {/* 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </SearchOverlayProvider>
        </ToastProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}
