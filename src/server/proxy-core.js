const UPSTREAM_BASE = process.env.UPSTREAM_BASE || 'https://www.sankavollerei.web.id/comic';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Yozora/1.0';

const cacheStore = new Map();

export function isPrivateOrLocalHost(hostname) {
  if (!hostname) return true;
  const host = hostname.toLowerCase().trim();
  if (['localhost', '127.0.0.1', '0.0.0.0', '::1', '::'].includes(host)) return true;
  if (host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) return true;
  return false;
}

export function isValidImageUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (isPrivateOrLocalHost(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export function getTtlForPath(subpath) {
  const p = (subpath || '').toLowerCase();
  if (p.includes('/genres') || p.includes('/genre/')) return 24 * 60 * 60 * 1000; // 24 jam
  if (p.includes('/detail/')) return 30 * 60 * 1000; // 30 mnt
  if (p.includes('/list') || p.includes('/daftar-manga') || p.includes('/latest') || p.includes('/popular')) return 10 * 60 * 1000; // 10 mnt
  if (p.includes('/chapter/')) return 10 * 60 * 1000; // 10 mnt
  if (p.includes('/home')) return 5 * 60 * 1000; // 5 mnt
  return 5 * 60 * 1000; // default 5 mnt
}

export function getCached(key) {
  const item = cacheStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return item.data;
}

export function setCached(key, data, ttl) {
  if (cacheStore.size > 1000) {
    const now = Date.now();
    for (const [k, v] of cacheStore.entries()) {
      if (now > v.expiresAt) cacheStore.delete(k);
    }
  }
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttl
  });
}

export async function fetchWithRetry(url, options = {}, retries = 2, timeoutMs = 25000) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          ...(options.headers || {})
        }
      });
      clearTimeout(timer);
      if (res.ok) return res;
      // Do not retry 4xx errors
      if (res.status >= 400 && res.status < 500) {
        return res;
      }
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
      } else {
        return res;
      }
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error('Fetch failed after retries');
}

export { UPSTREAM_BASE, USER_AGENT };
