export async function fetchApi<T>(path: string): Promise<T> {
  const url = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    let errMessage = `Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error || errJson.message) {
        errMessage = errJson.error || errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }

  const data = await response.json();
  if (data && data.success === false) {
    throw new Error(data.message || data.error || 'Terjadi kesalahan dari sumber data');
  }
  return data as T;
}

export function getProxiedImageUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return `/api/img?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}

export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const text = dateStr.trim();
  if (!text) return '';
  // If it's already "2 jam lalu", "kemarin", "3 hari lalu", etc., return as is
  if (text.includes('lalu') || text.includes('kemarin')) return text;

  // Try parsing timestamp or date
  const parsed = Date.parse(text);
  if (!isNaN(parsed)) {
    const diff = Date.now() - parsed;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days === 1) return 'kemarin';
    if (days < 30) return `${days} hari lalu`;
    if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
    return `${Math.floor(days / 365)} tahun lalu`;
  }

  return text;
}
