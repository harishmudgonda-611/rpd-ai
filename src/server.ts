import { createServer } from 'node:http';
import { fetchAndExtractProduct } from './extractor.js';
import { generateRPDFromUrl } from '../modules/rpd-runtime/runtime.js';
import { listProjects, saveProject, getProject, deleteProject } from './projects.js';
import { renderRPD } from '../modules/render-intelligence/renderer.js';
import { logViews, getPerformance, logClick, getClicks, logOrder, getOrders } from './business-intelligence.js';
import { calculateRevenueMetrics } from '../modules/revenue-intelligence/engine.js';
import { generateLearningRecommendations } from '../modules/learning-engine/engine.js';

const json = (res: any, status: number, body: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' });
  res.end(JSON.stringify(body, null, 2));
};

export function createRPDServer() {
  return createServer(async (req, res) => {
  try {
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

  if (req.method === 'GET' && req.url?.startsWith('/modules/rpd-production/output/')) {
    try {
      const { readFile } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const fileName = req.url.replace('/modules/rpd-production/output/', '');
      const filePath = join(process.cwd(), 'modules', 'rpd-production', 'output', fileName);
      const content = await readFile(filePath, 'utf8');
      const contentType = fileName.endsWith('.svg') ? 'image/svg+xml' : fileName.endsWith('.html') ? 'text/html' : 'text/plain';
      res.writeHead(200, { 'content-type': `${contentType}; charset=utf-8`, 'access-control-allow-origin': '*' });
      res.end(content);
      return;
    } catch {
      return json(res, 404, { ok: false, error: 'File not found' });
    }
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

  // Project persistence endpoints
  if (req.method === 'GET' && req.url === '/api/projects') {
    try {
      const projects = await listProjects();
      return json(res, 200, { ok: true, projects });
    } catch (error) {
      return json(res, 500, { ok: false, error: 'Failed to list projects' });
    }
  }

  if (req.method === 'POST' && req.url === '/api/projects') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || '{}');
      const project = await saveProject(body);
      return json(res, 200, { ok: true, project });
    } catch (error) {
      return json(res, 500, { ok: false, error: 'Failed to save project' });
    }
  }

  if (req.method === 'GET' && req.url?.startsWith('/api/projects/')) {
    const id = req.url.replace('/api/projects/', '');
    const project = await getProject(id);
    if (!project) return json(res, 404, { ok: false, error: 'Project not found' });
    return json(res, 200, { ok: true, project });
  }

  if (req.method === 'DELETE' && req.url?.startsWith('/api/projects/')) {
    const id = req.url.replace('/api/projects/', '');
    const deleted = await deleteProject(id);
    return json(res, 200, { ok: true, deleted });
  }

  // Render SVG / HTML slide endpoint
  if (req.method === 'POST' && req.url === '/api/rpd/render') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || '{}');
      const render = await renderRPD(body);
      return json(res, 200, { ok: true, render });
    } catch (error) {
      return json(res, 500, { ok: false, error: 'Failed to render RPD slides' });
    }
  }

  // MP4 Video export endpoint
  if (req.method === 'POST' && req.url === '/api/rpd/export/mp4') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || '{}');
      const { render1080x1920Mp4Video } = await import('../modules/render-intelligence/video-renderer.js');
      const { validateMp4Video } = await import('../modules/render-intelligence/video-validator.js');

      const videoRes = await render1080x1920Mp4Video(body);
      const validation = await validateMp4Video(videoRes.videoPath);

      return json(res, 200, {
        ok: true,
        video: videoRes,
        validation,
      });
    } catch (error) {
      return json(res, 500, { ok: false, error: 'Failed to prepare MP4 video export' });
    }
  }

  // PDF Carousel export endpoint
  if (req.method === 'POST' && req.url === '/api/rpd/export/pdf') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || '{}');
      const render = await renderRPD(body);

      return json(res, 200, {
        ok: true,
        pdfFilename: `rpd-carousel-${Date.now()}.pdf`,
        pageCount: render.slideCount,
        assets: render.assets
      });
    } catch (error) {
      return json(res, 500, { ok: false, error: 'Failed to prepare PDF export' });
    }
  }

  // Multi-slide ZIP export endpoint
  if (req.method === 'POST' && req.url === '/api/rpd/export/zip') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || '{}');
      const render = await renderRPD(body);

      // Return ZIP metadata manifest and slide SVGs for client zipping
      return json(res, 200, {
        ok: true,
        zipFilename: `rpd-carousel-${Date.now()}.zip`,
        slideCount: render.slideCount,
        assets: render.assets
      });
    } catch (error) {
      return json(res, 500, { ok: false, error: 'Failed to prepare ZIP export' });
    }
  }

  // Analytics & Business Intelligence Endpoints
  if (req.method === 'POST' && req.url === '/api/analytics/views') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || '{}');
      const perf = await logViews(body);
      return json(res, 200, { ok: true, perf });
    } catch (error) {
      return json(res, 500, { ok: false, error: 'Failed to log view analytics' });
    }
  }

  if (req.method === 'GET' && req.url?.startsWith('/api/analytics/views')) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const content_id = urlObj.searchParams.get('content_id') || undefined;
      const platform = urlObj.searchParams.get('platform') || undefined;
      const views = await getPerformance({ content_id, platform });
      return json(res, 200, { ok: true, views });
    } catch (error) {
      return json(res, 500, { ok: false, error: 'Failed to fetch view analytics' });
    }
  }

  if (req.method === 'POST' && req.url === '/api/affiliate/clicks') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || '{}');
      const click = await logClick(body);
      return json(res, 200, { ok: true, click });
    } catch (error) {
      return json(res, 500, { ok: false, error: 'Failed to log affiliate click' });
    }
  }

  if (req.method === 'GET' && req.url?.startsWith('/api/affiliate/clicks')) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const content_id = urlObj.searchParams.get('content_id') || undefined;
      const product_id = urlObj.searchParams.get('product_id') || undefined;
      const platform = urlObj.searchParams.get('platform') || undefined;
      const affiliate_network = urlObj.searchParams.get('affiliate_network') || undefined;
      const clicks = await getClicks({ content_id, product_id, platform, affiliate_network });
      return json(res, 200, { ok: true, clicks });
    } catch (error) {
      return json(res, 500, { ok: false, error: 'Failed to fetch affiliate clicks' });
    }
  }

  if (req.method === 'POST' && req.url === '/api/affiliate/orders') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || '{}');
      const order = await logOrder(body);
      return json(res, 200, { ok: true, order });
    } catch (error) {
      return json(res, 500, { ok: false, error: 'Failed to log affiliate order' });
    }
  }

  if (req.method === 'GET' && req.url?.startsWith('/api/affiliate/orders')) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const content_id = urlObj.searchParams.get('content_id') || undefined;
      const product_id = urlObj.searchParams.get('product_id') || undefined;
      const platform = urlObj.searchParams.get('platform') || undefined;
      const affiliate_network = urlObj.searchParams.get('affiliate_network') || undefined;
      const status = urlObj.searchParams.get('status') || undefined;
      const orders = await getOrders({ content_id, product_id, platform, affiliate_network, status });
      return json(res, 200, { ok: true, orders });
    } catch (error) {
      return json(res, 500, { ok: false, error: 'Failed to fetch affiliate orders' });
    }
  }

  if (req.method === 'GET' && req.url === '/api/analytics/summary') {
    try {
      const perfs = await getPerformance();
      const clicks = await getClicks();
      const orders = await getOrders();
      const revenue = calculateRevenueMetrics(perfs, clicks, orders);
      const recommendations = generateLearningRecommendations(perfs, clicks, orders);
      return json(res, 200, { ok: true, revenue, recommendations, counts: { views: perfs.length, clicks: clicks.length, orders: orders.length } });
    } catch (error) {
      return json(res, 500, { ok: false, error: 'Failed to retrieve analytics summary' });
    }
  }

  return json(res, 404, { ok: false, error: 'Not found' });
  } catch (error: any) {
    return json(res, 500, { ok: false, error: error?.message || 'Internal Server Error' });
  }
});
}

export function startServer(initialPort = Number(process.env.PORT ?? 8787), host = process.env.HOST ?? '127.0.0.1') {
  let currentPort = initialPort;
  const app = createRPDServer();

  app.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      if (process.env.STRICT_PORT === 'true') {
        console.error(`Port ${currentPort} is already in use (STRICT_PORT set). Exiting.`);
        process.exit(1);
      }
      console.warn(`Port ${currentPort} in use, retrying on port ${currentPort + 1}...`);
      currentPort += 1;
      app.listen(currentPort, host);
    } else {
      console.error('Server error:', err);
    }
  });

  const serverInstance = app.listen(currentPort, host, () => {
    console.log(`RPD Product Intelligence listening on http://${host}:${currentPort}`);
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
