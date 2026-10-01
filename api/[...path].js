import {
  UPSTREAM_BASE,
  getTtlForPath,
  getCached,
  setCached,
  fetchWithRetry,
} from '../src/server/proxy-core.js';

export default async function handler(req, res) {
  // Extract path and query from Vercel req.url or req.query.path
  let pathStr = req.url ? req.url.replace(/^\/api/, '') : '';
  if (!pathStr.startsWith('/')) {
    pathStr = '/' + pathStr;
  }

  const fullTargetUrl = `${UPSTREAM_BASE}${pathStr}`;

  if (req.method === 'GET') {
    const cached = getCached(pathStr);
    if (cached) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).send(cached);
    }
  }

  try {
    const upstreamRes = await fetchWithRetry(fullTargetUrl, {
      method: req.method,
      headers: {
        Accept: 'application/json',
      },
    }, 2, 25000);

    const rawText = await upstreamRes.text();
    let jsonBody;
    try {
      jsonBody = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        success: false,
        error: 'Upstream returned non-JSON response',
        status: upstreamRes.status,
      });
    }

    if (jsonBody && jsonBody.success === false) {
      return res.status(upstreamRes.status >= 400 ? upstreamRes.status : 400).json(jsonBody);
    }

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json(jsonBody || {
        success: false,
        error: `Upstream error with status ${upstreamRes.status}`,
      });
    }

    if (req.method === 'GET') {
      const ttl = getTtlForPath(pathStr);
      setCached(pathStr, rawText, ttl);
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Cache', 'MISS');
    return res.status(upstreamRes.status).send(rawText);
  } catch (err) {
    return res.status(504).json({
      success: false,
      error: 'Upstream request timeout or network error',
      message: err.message,
    });
  }
}
