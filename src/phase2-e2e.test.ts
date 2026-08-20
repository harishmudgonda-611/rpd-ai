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

test('Full Phase 2 End-To-End Journey: Product -> Creative -> Content -> Views -> Clicks -> Orders -> Revenue -> Learning', async () => {
  const mockProductHtml = `
    <!doctype html>
    <html>
      <head>
        <title>DAMAAR TEXTILE Tropical Print Top</title>
        <script type="application/ld+json">
        {
          "@type": "Product",
          "name": "DAMAAR TEXTILE Tropical Print Top",
          "offers": { "@type": "Offer", "price": 298, "priceCurrency": "INR" }
        }
        </script>
      </head>
      <body><h1>Top</h1></body>
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

    // 1. Generate RPD Content
    const genRes = await fetch(`http://127.0.0.1:${port}/api/rpd/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: productUrl })
    });
    assert.equal(genRes.status, 200);
    const genData = await genRes.json();
    assert.ok(genData.result.generation.content.videoScript);

    // 2. Log Views
    const viewRes = await fetch(`http://127.0.0.1:${port}/api/analytics/views`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contentId: 'c_e2e', platform: 'instagram', publishedAt: new Date().toISOString(), views: 1000, likes: 20, comments: 2, shares: 1, saves: 5, followersGained: 2 })
    });
    assert.equal(viewRes.status, 200);

    // 3. Log Clicks
    const clickRes = await fetch(`http://127.0.0.1:${port}/api/affiliate/clicks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contentId: 'c_e2e', productId: 'p_e2e', affiliateNetwork: 'myntra', platform: 'instagram' })
    });
    assert.equal(clickRes.status, 200);

    // 4. Log Orders
    const orderRes = await fetch(`http://127.0.0.1:${port}/api/affiliate/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contentId: 'c_e2e', productId: 'p_e2e', orderValue: 298, commission: 29.8, commissionStatus: 'confirmed' })
    });
    assert.equal(orderRes.status, 200);

    // 5. Query Revenue & Learning Analytics
    const summaryRes = await fetch(`http://127.0.0.1:${port}/api/analytics/summary`);
    assert.equal(summaryRes.status, 200);
    const summaryData = await summaryRes.json();
    assert.ok(summaryData.revenue.totalCommission >= 29.8);
    assert.ok(summaryData.recommendations);
  } finally {
    await close();
    await new Promise<void>((res) => htmlServer.close(() => res()));
  }
});
