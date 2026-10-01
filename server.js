import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  UPSTREAM_BASE,
  isValidImageUrl,
  getTtlForPath,
  getCached,
  setCached,
  fetchWithRetry,
} from './src/server/proxy-core.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

const app = express();

// Disable x-powered-by
app.disable('x-powered-by');

// Image proxy: /api/img?url=...
app.get('/api/img', async (req, res) => {
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
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const arrayBuffer = await upstreamRes.arrayBuffer();
    return res.end(Buffer.from(arrayBuffer));
  } catch (err) {
    return res.status(502).json({ error: 'Failed to fetch image from upstream', message: err.message });
  }
});

// API proxy: /api/*
app.use('/api', async (req, res) => {
  const subpath = req.url; // includes query string, e.g. /mangakita/home or /westmanga/list?page=1
  const fullTargetUrl = `${UPSTREAM_BASE}${subpath}`;

  // Check in-memory cache for GET requests
  if (req.method === 'GET') {
    const cached = getCached(subpath);
    if (cached) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('X-Cache', 'HIT');
      return res.send(cached);
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

    // Check upstream success flag or status
    if (jsonBody && jsonBody.success === false) {
      return res.status(upstreamRes.status >= 400 ? upstreamRes.status : 400).json(jsonBody);
    }

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json(jsonBody || {
        success: false,
        error: `Upstream error with status ${upstreamRes.status}`,
      });
    }

    // Cache successful GET responses
    if (req.method === 'GET') {
      const ttl = getTtlForPath(subpath);
      setCached(subpath, rawText, ttl);
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Cache', 'MISS');
    return res.send(rawText);
  } catch (err) {
    return res.status(504).json({
      success: false,
      error: 'Upstream request timeout or network error',
      message: err.message,
    });
  }
});

// Dev vs Prod Vite Integration
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Yozora] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
