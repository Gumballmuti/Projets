// Serveur local de prévisualisation (URL sans extension, comme en production)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const dist = join(process.cwd(), 'dist');
const port = Number(process.env.PORT) || 4173;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml',
  '.txt': 'text/plain', '.webmanifest': 'application/manifest+json',
};

async function resolve(p) {
  for (const c of [p, `${p}.html`, join(p, 'index.html')]) {
    try { if ((await stat(c)).isFile()) return c; } catch {}
  }
  return null;
}

createServer(async (req, res) => {
  if (req.url.startsWith('/api/')) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end('{"error":"Indisponible en local"}');
  }
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = await resolve(join(dist, path));
  const target = file || join(dist, '404.html');
  res.writeHead(file ? 200 : 404, { 'Content-Type': types[extname(target)] || 'application/octet-stream' });
  res.end(await readFile(target));
}).listen(port, () => console.log(`Aperçu : http://localhost:${port}`));
