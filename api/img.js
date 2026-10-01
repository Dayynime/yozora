import { isValidImageUrl, fetchWithRetry } from '../src/server/proxy-core.js';

export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "url" query parameter' });
  }

  if (!isValidImageUrl(targetUrl)) {
    return res.status(400).json({ error: 'Forbidden or invalid target image URL' });
  }

  try {
    const upstreamRes = await fetchWithRetry(targetUrl, {
      headers: {
        Referer: '',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    }, 2, 20000);

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({ error: `Upstream returned status ${upstreamRes.status}` });
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const arrayBuffer = await upstreamRes.arrayBuffer();
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err) {
    return res.status(502).json({ error: 'Failed to fetch image from upstream', message: err.message });
  }
}
