import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getSavedSource } from '../lib/storage';

export function NotFoundPage() {
  const currentSource = getSavedSource();

  return (
    <>
      <Helmet>
        <title>404 Halaman Tidak Ditemukan — Yozora</title>
      </Helmet>

      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h1 className="font-serif text-3xl font-bold text-main">404</h1>
        <p className="text-sm text-muted">
          Halaman yang Anda tuju tidak ditemukan atau telah dipindahkan.
        </p>
        <div className="pt-2">
          <Link
            to={`/${currentSource}`}
            className="inline-block px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-sm transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </>
  );
}
