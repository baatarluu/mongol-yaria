// Локал хөгжүүлэлтийн HTTP сервер — /api/* дуудлагыг цөм router руу дамжуулна.
// Ажиллуулах: node server/dev-server.js  (эсвэл npm run dev:api)
// Vite (5174) нь /api-г энд (4000) проксидоно.

import http from 'http';
import { handleRequest } from './app.js';

// .env файлыг хялбар уншигч (dotenv хамаарал шаардахгүй).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
    }
  }
}

const PORT = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (chunk) => (raw += chunk));
  req.on('end', async () => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let body = {};
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        body = {};
      }
    }
    try {
      const result = await handleRequest({
        method: req.method,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams.entries()),
        body,
        headers: req.headers,
      });
      res.writeHead(result.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.body));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 classroom dev API → http://localhost:${PORT}/api`);
});
