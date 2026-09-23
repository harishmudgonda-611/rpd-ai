import { createServer } from 'node:http';
import { fetchAndExtractProduct } from './extractor.js';
import { generateRPDFromUrl } from '../modules/rpd-runtime/runtime.js';
import { listProjects, saveProject, getProject, deleteProject } from './projects.js';
import { renderRPD } from '../modules/render-intelligence/renderer.js';
import { logViews, getPerformance, logClick, getClicks, logOrder, getOrders } from './business-intelligence.js';
import { calculateRevenueMetrics } from '../modules/revenue-intelligence/engine.js';
import { generateLearningRecommendations } from '../modules/learning-engine/engine.js';
import { qualifyProduct } from '../modules/product-qualification/engine.js';
import { createAffiliateLink, getAffiliateLink, listAffiliateLinks, registerAffiliateClick } from './affiliate.js';
import { rateLimit, requireAdmin, requestId, readBody } from './security.js';
import { createZip } from './zip.js';
import { upsertProduct, listProducts, publishProduct } from './products.js';

const json = (res: any, status: number, body: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'x-request-id': requestId(), 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'referrer-policy': 'strict-origin-when-cross-origin', 'content-security-policy': \"default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https:;\", 'access-control-allow-origin': process.env.PUBLIC_ORIGIN ?? 'null', 'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS', 'access-control-allow-headers': 'content-type,authorization' });
  res.end(JSON.stringify(body, null, 2));
};

export function createRPDServer() {
  return createServer(async (req, res) => {
  if (!rateLimit(req)) return json(res, 429, { ok: false, error: 'Rate limit exceeded' });
  if (req.method === 'OPTIONS') return json(res, 204, {});
  const publicRoute = req.method === 'GET' && (req.url === '/' || req.url === '/index.html' || req.url === '/deals' || req.url === '/health' || req.url?.startsWith('/go/'));
  if (!publicRoute && !requireAdmin(req)) return json(res, 401, { ok: false, error: 'Authentication required' });

  if (req.method === 'GET' && req.url === '/deals') {
    const products = await listProducts(true);
    const cards = products.map((p:any) => {
      const image = p.images?.[0] || '';
      const price = p.price != null ? '₹' + Number(p.price).toLocaleString('en-IN') : 'See deal';
      const mrp = p.mrp != null ? '₹' + Number(p.mrp).toLocaleString('en-IN') : '';
      const off = p.discountPercent != null ? Math.round(Number(p.discountPercent)) + '% OFF' : '';
      const href = '/go/' + encodeURIComponent(p.affiliateLinkId);
      return '<article class="card"><img src="' + image.replace(/"/g,'&quot;') + '" alt=""><div class="body"><div class="platform">' + p.platform + '</div><h2>' + String(p.title).replace(/</g,'&lt;') + '</h2><div class="price">' + price + ' <del>' + mrp + '</del></div><div class="off">' + off + '</div><a href="' + href + '">View Deal</a></div></article>';
    }).join('');
    const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Right Price Deals</title><style>body{font-family:system-ui;margin:0;background:#fff7fa;color:#171717}.wrap{max-width:1100px;margin:auto;padding:24px}.brand{font-size:28px;font-weight:900;color:#ff4f87}.sub{color:#666}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.card{background:white;border-radius:18px;overflow:hidden;box-shadow:0 4px 20px #0001}.card img{width:100%;aspect-ratio:1/1;object-fit:cover;background:#eee}.body{padding:14px}.platform{font-size:12px;color:#777;text-transform:uppercase}.card h2{font-size:16px;min-height:42px}.price{font-size:21px;font-weight:800}.price del{font-size:13px;color:#999;font-weight:400}.off{display:inline-block;background:#ffe36b;padding:4px 8px;border-radius:8px;margin:8px 0;font-weight:700}.card a{display:block;text-align:center;background:#ff4f87;color:white;text-decoration:none;padding:11px;border-radius:10px;font-weight:700}.disclosure{font-size:12px;color:#777;margin:18px 0}</style></head><body><main class="wrap"><div class="brand">RIGHT PRICE DEALS</div><p class="sub">Curated deals worth checking.</p><p class="disclosure">Affiliate disclosure: some links may earn RPD a commission at no extra cost to you.</p><section class="grid">' + (cards || '<p>No published deals yet.</p>') + '</section></main></body></html>';
    res.writeHead(200, {'content-type':'text/html; charset=utf-8','cache-control':'no-store'}); res.end(html); return;
  }

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
  if (req.method === 'GET' && req.url?.startsWith('/go/')) {
    const id = decodeURIComponent(req.url.slice('/go/'.length).split('?')[0]);
    const link = await getAffiliateLink(id);
    if (!link) return json(res, 404, { ok: false, error: 'Affiliate link not found' });
    await registerAffiliateClick(id);
    res.writeHead(302, { location: link.destinationUrl, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/affiliate-links') {
    return json(res, 200, { ok: true, links: await listAffiliateLinks() });
  }

  if (req.method === 'POST' && req.url === '/api/affiliate-links') {
    try {
      let raw = await readBody(req, 256 * 1024);
      const body = JSON.parse(raw || '{}');
      const link = await createAffiliateLink({
        productId: String(body.productId || '').trim(),
        network: String(body.network || '').trim(),
        destinationUrl: String(body.destinationUrl || '').trim(),
        label: body.label ? String(body.label) : undefined
      });
      return json(res, 201, { ok: true, link, trackingUrl: '/go/' + link.id });
    } catch (error) {
      return json(res, 400, { ok: false, error: error instanceof Error ? error.message : 'Invalid affiliate link' });
    }
  }

  if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true, service: 'rpd-product-intelligence', version: '0.2.0' });
  if (req.method === 'POST' && req.url === '/api/rpd/generate') {
    try {
      let raw = await readBody(req, 1024 * 1024);

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

  if (req.method === 'POST' && req.url === '/api/product/qualify') {
    try {
      let raw = await readBody(req, 1024 * 1024);
      const body = JSON.parse(raw || '{}');
      const product = body.product ?? body;
      const result = qualifyProduct({
        price: product.price?.value ?? product.price,
        mrp: product.mrp?.value ?? product.mrp,
        discountPercent: product.discountPercent?.value ?? product.discountPercent,
        imageCount: Array.isArray(product.images) ? product.images.length : Number(product.imageCount ?? 0),
        title: product.title?.value ?? product.title,
        platform: product.platform?.value ?? product.platform
      });
      return json(res, 200, { ok: true, qualification: result });
    } catch (error) {
      return json(res, 400, { ok: false, error: 'Invalid product qualification request' });
    }
  }

  if (req.method === 'POST' && req.url === '/api/product/extract') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || '{}');
      if (typeof body.url !== 'string' || !body.url.trim()) return json(res, 400, { ok: false, error: 'url is required' });
      const product = await fetchAndExtractProduct(body.url.trim());
      const qualification = qualifyProduct({ price: product.price.value, mrp: product.mrp.value, discountPercent: product.discountPercent.value, imageCount: product.images.length, title: product.title.value, platform: new URL(product.sourceUrl).hostname });
      const stored = await upsertProduct(product, qualification);
      return json(res, 200, { ok: true, product, qualification, stored });
    } catch (error) {
      return json(res, 502, { ok: false, error: error instanceof Error ? error.message : 'Product extraction failed' });
    }
  }

  if (req.method === 'GET' && req.url === '/api/products') return json(res, 200, { ok: true, products: await listProducts(false) });

  if (req.method === 'POST' && req.url === '/api/products/publish') {
    try {
      let raw=''; for await (const chunk of req) raw += chunk;
      const body=JSON.parse(raw||'{}');
      if(typeof body.id!=='string') return json(res,400,{ok:false,error:'id is required'});
      if(body.published && typeof body.affiliateLinkId!=='string') return json(res,400,{ok:false,error:'affiliateLinkId is required before publishing'});
      const product=await publishProduct(body.id,Boolean(body.published),body.affiliateLinkId);
      if(!product) return json(res,404,{ok:false,error:'Product not found'});
      return json(res,200,{ok:true,product});
    } catch { return json(res,400,{ok:false,error:'Invalid publish request'}); }
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

  // Multi-slide ZIP export endpoint
  if (req.method === 'POST' && req.url === '/api/rpd/export/zip') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || '{}');
      const render = await renderRPD(body);

      const files = render.assets.map((asset) => ({ name: asset.path.split('/').pop() || asset.id, path: asset.path }));
      const zip = await createZip(files);
      res.writeHead(200, { 'content-type': 'application/zip', 'content-disposition': 'attachment; filename="rpd-carousel.zip"', 'content-length': String(zip.length), 'cache-control': 'no-store' });
      res.end(zip);
      return;
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
