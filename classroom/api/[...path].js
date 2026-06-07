// Vercel serverless adapter — бүх /api/* дуудлагыг цөм router руу дамжуулна.
import { handleRequest } from '../server/app.js';

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const query = Object.fromEntries(url.searchParams.entries());
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const result = await handleRequest({
      method: req.method,
      path: url.pathname,
      query,
      body: body || {},
      headers: req.headers,
    });
    res.status(result.status).json(result.body);
  } catch (e) {
    res.status(500).json({ error: 'Серверийн алдаа: ' + e.message });
  }
}
