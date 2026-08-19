import { createServer } from 'node:http';
import { fetchAndExtractProduct } from './extractor.js';
import { generateRPDFromUrl } from '../modules/rpd-runtime/runtime.js';

const json = (res: any, status: number, body: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' });
  res.end(JSON.stringify(body, null, 2));
};

export function createRPDServer() {
  return createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});

  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'access-control-allow-origin': '*',
    });

    const { readFile } = await import('node:fs/promises');
    const html = await readFile(
      new URL('./public/index.html', import.meta.url),
      'utf8',
    );

    res.end(html);
    return;
  }
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
      const extractionError = error as {
        name?: string;
        code?: string;
        status?: number;
        platform?: string;
        message?: string;
      };

      const status =
        extractionError.code === 'INVALID_URL'
          ? 400
          : extractionError.code === 'UPSTREAM_ACCESS_BLOCKED'
            ? 424
            : 502;

      return json(res, status, {
        ok: false,
        error: extractionError.message ?? 'RPD generation failed',
        code: extractionError.code ?? 'RPD_GENERATION_FAILED',
        platform: extractionError.platform ?? null,
        upstreamStatus: extractionError.status ?? null,
        nextStep:
          extractionError.code === 'UPSTREAM_ACCESS_BLOCKED'
            ? 'browser-assisted-extraction'
            : extractionError.code === 'PRODUCT_DATA_NOT_FOUND'
              ? 'verify-product-url'
              : null,
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
}

export function startServer(port = Number(process.env.PORT ?? 8787), host = process.env.HOST ?? '127.0.0.1') {
  const app = createRPDServer();

  app.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Clean up running process or choose a free port with PORT environment variable.`);
      process.exit(1);
    }
  });

  const serverInstance = app.listen(port, host, () => {
    console.log(`RPD Product Intelligence listening on http://${host}:${port}`);
  });

  const shutdown = () => {
    serverInstance.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return serverInstance;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  startServer();
}
