import { useState, useEffect } from 'react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-line text-muted border-b border-line px-4 py-1.5 text-center text-xs font-mono flex items-center justify-center gap-2">
      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      <span>Anda sedang luring (offline). Menampilkan data lokal yang telah tersimpan.</span>
    </div>
  );
}
