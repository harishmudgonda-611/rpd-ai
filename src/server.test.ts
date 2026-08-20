import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createRPDServer } from './server.js';

function listenServer(server: ReturnType<typeof createRPDServer>): Promise<{ port: number; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      resolve({
        port: addr.port,
        close: () => new Promise<void>((res) => server.close(() => res())),
      });
    });
  });
}

test('GET /health returns service status', async () => {
  const app = createRPDServer();
  const { port, close } = await listenServer(app);

  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.service, 'rpd-product-intelligence');
  } finally {
    await close();
  }
});

test('POST /api/product/extract returns error on invalid payload', async () => {
  const app = createRPDServer();
  const { port, close } = await listenServer(app);

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/product/extract`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.error, 'url is required');
  } finally {
    await close();
  }
});

test('GET /api/projects and POST /api/projects manages persistent projects', async () => {
  const app = createRPDServer();
  const { port, close } = await listenServer(app);

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/api/projects`);
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.ok, true);
    assert.ok(Array.isArray(listData.projects));

    const saveRes = await fetch(`http://127.0.0.1:${port}/api/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Saved Carousel Project',
        template: 'rpd-pink-deal',
        slides: [{ index: 1, headline: 'Slide Headline' }],
      }),
    });
    assert.equal(saveRes.status, 200);
    const saveData = await saveRes.json();
    assert.equal(saveData.ok, true);
    assert.equal(saveData.project.title, 'Test Saved Carousel Project');

    const getRes = await fetch(`http://127.0.0.1:${port}/api/projects/${saveData.project.id}`);
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.project.template, 'rpd-pink-deal');

    const delRes = await fetch(`http://127.0.0.1:${port}/api/projects/${saveData.project.id}`, { method: 'DELETE' });
    assert.equal(delRes.status, 200);
  } finally {
    await close();
  }
});

test('POST /api/rpd/render renders slides to output directory', async () => {
  const app = createRPDServer();
  const { port, close } = await listenServer(app);

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/rpd/render`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        productTitle: 'Render Test Product',
        price: 298,
        slides: [{ index: 1, role: 'hero', headline: 'Test Render Slide' }],
        template: 'rpd-editorial',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.render.assets.length > 0);
  } finally {
    await close();
  }
});

test('GET /api/analytics/views, GET /api/affiliate/clicks, and GET /api/affiliate/orders support query filtering and idempotent ingestion', async () => {
  const app = createRPDServer();
  const { port, close } = await listenServer(app);
  const testId = `c_filt_${Date.now()}`;

  try {
    // 1. Post view metric
    const postView = await fetch(`http://127.0.0.1:${port}/api/analytics/views`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content_id: testId, platform: 'instagram', views: 500 })
    });
    assert.equal(postView.status, 200);

    const getView = await fetch(`http://127.0.0.1:${port}/api/analytics/views?content_id=${testId}`);
    assert.equal(getView.status, 200);
    const viewData = await getView.json();
    assert.equal(viewData.views[0].views, 500);

    // 2. Post click metric
    const clickId = `click_${testId}`;
    const postClick = await fetch(`http://127.0.0.1:${port}/api/affiliate/clicks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ click_id: clickId, content_id: testId, product_id: 'p_test1', affiliate_network: 'myntra' })
    });
    assert.equal(postClick.status, 200);

    const getClick = await fetch(`http://127.0.0.1:${port}/api/affiliate/clicks?content_id=${testId}`);
    assert.equal(getClick.status, 200);
    const clickData = await getClick.json();
    assert.equal(clickData.clicks.length, 1);

    // 3. Post order metric idempotently
    const orderId = `ord_${testId}`;
    const postOrder1 = await fetch(`http://127.0.0.1:${port}/api/affiliate/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, content_id: testId, product_id: 'p_test1', order_value: 298, commission: 29.8, order_status: 'pending' })
    });
    assert.equal(postOrder1.status, 200);

    // Re-ingest same order_id to update status to confirmed
    const postOrder2 = await fetch(`http://127.0.0.1:${port}/api/affiliate/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, content_id: testId, product_id: 'p_test1', order_value: 298, commission: 29.8, order_status: 'confirmed' })
    });
    assert.equal(postOrder2.status, 200);

    const getOrder = await fetch(`http://127.0.0.1:${port}/api/affiliate/orders?content_id=${testId}`);
    assert.equal(getOrder.status, 200);
    const orderData = await getOrder.json();
    assert.equal(orderData.orders.length, 1);
    assert.equal(orderData.orders[0].orderStatus, 'confirmed');
  } finally {
    await close();
  }
});

test('POST /api/rpd/generate handles end-to-end carousel generation request', async () => {
  // Create a mock product HTML server
  const mockProductHtml = `
    <!doctype html>
    <html>
      <head>
        <title>DAMAAR TEXTILE Tropical Print Top</title>
        <script type="application/ld+json">
        {
          "@type": "Product",
          "name": "DAMAAR TEXTILE Tropical Print Top",
          "color": "#ee5f73",
          "image": [
            "https://cdn.example.com/products/top-front.jpg",
            "https://constant.myntassets.com/web/assets/img/sudio-nav-banner.png"
          ],
          "offers": { "@type": "Offer", "price": 298, "priceCurrency": "INR" }
        }
        </script>
      </head>
      <body>
        <h1>DAMAAR TEXTILE Tropical Print Top</h1>
      </body>
    </html>
  `;

  const htmlServer = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(mockProductHtml);
  });

  const htmlAddr = await new Promise<AddressInfo>((res) => htmlServer.listen(0, '127.0.0.1', () => res(htmlServer.address() as AddressInfo)));

  const app = createRPDServer();
  const { port, close } = await listenServer(app);

  try {
    const productUrl = `http://127.0.0.1:${htmlAddr.port}/product/123`;
    const res = await fetch(`http://127.0.0.1:${port}/api/rpd/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: productUrl }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.ok(body.result);

    const result = body.result;

    // Verify HEX color #ee5f73 was rejected from colors
    assert.equal(result.product.colors.length, 0);

    // Verify sudio-nav-banner.png was rejected from usable product images
    const usableImages = result.assets.productImages.map((img: any) => img.url);
    assert.ok(usableImages.includes('https://cdn.example.com/products/top-front.jpg'));
    assert.ok(!usableImages.includes('https://constant.myntassets.com/web/assets/img/sudio-nav-banner.png'));

    // Verify carousel output was generated
    assert.ok(result.render);
    assert.ok(result.generation.carousel.slides.length > 0);
  } finally {
    await close();
    await new Promise<void>((res) => htmlServer.close(() => res()));
  }
});
