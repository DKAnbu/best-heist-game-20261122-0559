// serve.ts — a tiny static file server for play-testing VAULTBREAK
// locally. Serves game/ at http://localhost:8080 (open
// http://localhost:8080/?scene=cover for a screenshot scene).
// Node 22, standard library only; run with `node serve.ts`.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('game/', import.meta.url));
const port = Number(process.env.PORT ?? 8080);

const mimeByExtension = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost');
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/index.html';
    const file = join(root, normalize(path));
    if (!file.startsWith(root)) {
      response.writeHead(403);
      response.end('forbidden');
      return;
    }
    const body = await readFile(file);
    response.writeHead(200, {
      'content-type': mimeByExtension[extname(file)] ?? 'application/octet-stream',
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('not found');
  }
});

server.listen(port, () => {
  console.log(`VAULTBREAK served at http://localhost:${port}`);
});
