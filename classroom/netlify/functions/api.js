// Netlify serverless adapter — /api/* (redirect-ээр) дуудлагыг цөм router руу дамжуулна.
import { handleRequest } from '../../server/app.js';

export const handler = async (event) => {
  try {
    const query = event.queryStringParameters || {};
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {
        body = {};
      }
    }
    // netlify.toml redirect: /api/* → /.netlify/functions/api/:splat
    const path = event.path.replace(/^\/\.netlify\/functions\/api/, '/api');
    const result = await handleRequest({
      method: event.httpMethod,
      path,
      query,
      body,
      headers: event.headers || {},
    });
    return {
      statusCode: result.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.body),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Серверийн алдаа: ' + e.message }),
    };
  }
};
