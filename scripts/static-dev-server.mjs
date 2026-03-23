/**
 * Local static + SPA dev server (Node only — no Python required).
 * Parity with scripts/server.py: GET /config.js, GET /api/products, POST /api/wishlist,
 * POST /api/products (admin), OPTIONS for /api/*. SPA fallback for unknown routes.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/** Explicit PORT from env → use only that port. Otherwise start at 8000 and skip busy ports. */
const PORT_LOCKED = process.env.PORT !== undefined && process.env.PORT !== '';
const START_PORT = PORT_LOCKED ? Number(process.env.PORT) : 8000;
const MAX_PORT_TRY = PORT_LOCKED ? START_PORT : START_PORT + 10;

function parseEnvLocal() {
  const p = path.join(ROOT, '.env.local');
  const config = {};
  if (!fs.existsSync(p)) return config;
  const text = fs.readFileSync(p, 'utf8');
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    const value = t.slice(i + 1).trim();
    if (key) config[key] = value;
  }
  return config;
}

function getApiKey() {
  return parseEnvLocal().API_KEY || process.env.API_KEY || 'demo-key-123';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function corsApiHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/** Strip query string issues; collapse slashes; trim trailing slash (except /). */
function normalizePathname(pathname) {
  if (!pathname) return '/';
  let p = pathname.replace(/\/{2,}/g, '/');
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.map': 'application/json',
    '.txt': 'text/plain; charset=utf-8',
  };
  return mimes[ext] || 'application/octet-stream';
}

/** Resolve URL path to a file under ROOT; reject path traversal. */
function fileUnderRoot(rel) {
  const normalizedRoot = path.resolve(ROOT);
  const full = path.resolve(normalizedRoot, rel);
  if (full !== normalizedRoot && !full.startsWith(normalizedRoot + path.sep)) {
    return null;
  }
  return full;
}

function checkApiAuth(req, res) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== getApiKey()) {
    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return false;
  }
  return true;
}

async function handlePostWishlist(req, res) {
  if (!checkApiAuth(req, res)) return;
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    corsApiHeaders(res);
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const { action, userId, wishlist } = body;
  if (!action || !userId) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    corsApiHeaders(res);
    res.end(JSON.stringify({ error: 'Missing action or userId' }));
    return;
  }

  const dataDir = path.join(ROOT, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const wishlistFile = path.join(dataDir, `wishlist_${userId}.json`);

  let outWishlist = Array.isArray(wishlist) ? wishlist : [];
  if (action === 'save') {
    fs.writeFileSync(wishlistFile, JSON.stringify(outWishlist, null, 2), 'utf8');
  } else if (action === 'load') {
    if (fs.existsSync(wishlistFile)) {
      try {
        outWishlist = JSON.parse(fs.readFileSync(wishlistFile, 'utf8'));
      } catch {
        outWishlist = [];
      }
    } else {
      outWishlist = [];
    }
  } else {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    corsApiHeaders(res);
    res.end(JSON.stringify({ error: 'Invalid action' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  corsApiHeaders(res);
  res.end(JSON.stringify({ success: true, wishlist: outWishlist }));
}

async function handlePostProducts(req, res) {
  if (!checkApiAuth(req, res)) return;
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    corsApiHeaders(res);
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const { action, product } = body;
  if (!action || !product) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    corsApiHeaders(res);
    res.end(JSON.stringify({ error: 'Missing action or product' }));
    return;
  }

  const productsFile = path.join(ROOT, 'data', 'products.json');
  if (!fs.existsSync(productsFile)) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    corsApiHeaders(res);
    res.end(JSON.stringify({ error: 'Products file not found' }));
    return;
  }

  let products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

  if (action === 'create') {
    const maxId = (products.length ? Math.max(...products.map((p) => p.id || 0)) : 0);
    product.id = maxId + 1;
    products.push(product);
  } else if (action === 'update') {
    const idx = products.findIndex((p) => p.id === product.id);
    if (idx === -1) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      corsApiHeaders(res);
      res.end(JSON.stringify({ error: 'Product not found' }));
      return;
    }
    products[idx] = product;
  } else if (action === 'delete') {
    products = products.filter((p) => p.id !== product.id);
  } else {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    corsApiHeaders(res);
    res.end(JSON.stringify({ error: 'Invalid action' }));
    return;
  }

  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf8');
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  corsApiHeaders(res);
  res.end(JSON.stringify({ success: true }));
}

async function handleGetWishlist(req, res) {
  if (!checkApiAuth(req, res)) return;
  const host = req.headers.host || 'localhost';
  const u = new URL(req.url || '/', `http://${host}`);
  const userId = u.searchParams.get('userId');
  if (!userId) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    corsApiHeaders(res);
    res.end(JSON.stringify({ error: 'Missing userId' }));
    return;
  }
  const dataDir = path.join(ROOT, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const wishlistFile = path.join(dataDir, `wishlist_${userId}.json`);
  let outWishlist = [];
  if (fs.existsSync(wishlistFile)) {
    try {
      const raw = JSON.parse(fs.readFileSync(wishlistFile, 'utf8'));
      outWishlist = Array.isArray(raw) ? raw : [];
    } catch {
      outWishlist = [];
    }
  }
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
  corsApiHeaders(res);
  res.end(JSON.stringify({ success: true, wishlist: outWishlist }));
}

async function onRequest(req, res) {
  const host = req.headers.host || 'localhost';
  const u = new URL(req.url || '/', `http://${host}`);
  const pathname = normalizePathname(u.pathname);

  if (req.method === 'OPTIONS' && pathname.startsWith('/api')) {
    res.writeHead(204);
    corsApiHeaders(res);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    if (pathname === '/api/wishlist') {
      await handlePostWishlist(req, res);
      return;
    }
    if (pathname === '/api/products') {
      await handlePostProducts(req, res);
      return;
    }
    res.writeHead(405, { Allow: 'GET, HEAD, POST, OPTIONS' });
    res.end();
    return;
  }

  if (req.method === 'GET' && pathname === '/api/wishlist') {
    await handleGetWishlist(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD, POST, OPTIONS' });
    res.end();
    return;
  }

  if (pathname === '/config.js') {
    const config = parseEnvLocal();
    const body = `window.ENV_CONFIG = ${JSON.stringify(config)};`;
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.end(body);
    }
    return;
  }

  if (pathname === '/api/products') {
    try {
      const p = path.join(ROOT, 'data', 'products.json');
      const data = fs.readFileSync(p, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      });
      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end(data);
      }
    } catch {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end('[]');
    }
    return;
  }

  const rel = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const filePath = fileUnderRoot(rel);

  if (!filePath) {
    res.writeHead(403);
    res.end();
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': getMime(filePath) });
    if (req.method === 'HEAD') {
      res.end();
    } else {
      fs.createReadStream(filePath).pipe(res);
    }
    return;
  }

  const base = path.basename(pathname);
  if (!base.includes('.')) {
    const indexPath = path.join(ROOT, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (req.method === 'HEAD') {
        res.end();
      } else {
        fs.createReadStream(indexPath).pipe(res);
      }
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}

function listen(port) {
  const server = http.createServer(onRequest);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && !PORT_LOCKED && port < MAX_PORT_TRY) {
      const next = port + 1;
      console.warn(`Port ${port} is in use, trying ${next}...`);
      listen(next);
      return;
    }
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${port} is already in use. Stop the other dev server (or any app on that port), or run:\n` +
          `  set PORT=8001 && npm run dev     (Windows cmd)\n` +
          `  $env:PORT=8001; npm run dev     (PowerShell)\n` +
          `  PORT=8001 npm run dev           (macOS / Linux / Git Bash)`
      );
      process.exit(1);
    }
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`Dev server (Node) at http://localhost:${port}/`);
    console.log('  ES modules: /src/app.js — keep this terminal open while developing.');
    console.log('  Optional: npm run dev:python for the Python server (same API surface).');
  });
}

listen(Number.isFinite(START_PORT) ? START_PORT : 8000);
