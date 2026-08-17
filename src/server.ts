import { createServer } from 'node:http';
import { fetchAndExtractProduct } from './extractor.js';
import { generateRPDFromUrl } from '../modules/rpd-runtime/runtime.js';

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? '127.0.0.1';

const json = (res: any, status: number, body: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' });
  res.end(JSON.stringify(body, null, 2));
};

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true, service: 'rpd-product-intelligence', version: '0.2.0' });
  if (req.method === 'POST' && req.url === '/api/rpd/generate') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;

      const body = JSON.parse(raw || '{}');

      if (typeof body.url !== 'string' || !body.url.trim()) {
        return json(res, 400, {
          ok: false,
          error: 'url is required',
        });
      }

      const result = await generateRPDFromUrl({
        url: body.url.trim(),
        platforms: Array.isArray(body.platforms)
          ? body.platforms
          : undefined,
        modelAssets: Array.isArray(body.modelAssets)
          ? body.modelAssets
          : undefined,
      });

      return json(res, 200, {
        ok: true,
        result,
      });
    } catch (error) {
      return json(res, 502, {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'RPD generation failed',
      });
    }
  }

  if (req.method === 'POST' && req.url === '/api/product/extract') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || '{}');
      if (typeof body.url !== 'string' || !body.url.trim()) return json(res, 400, { ok: false, error: 'url is required' });
      const product = await fetchAndExtractProduct(body.url.trim());
      return json(res, 200, { ok: true, product });
    } catch (error) {
      return json(res, 502, { ok: false, error: error instanceof Error ? error.message : 'Product extraction failed' });
    }
  }
  return json(res, 404, { ok: false, error: 'Not found' });
});

server.listen(port, host, () => console.log(`RPD Product Intelligence listening on http://${host}:${port}`));
