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
