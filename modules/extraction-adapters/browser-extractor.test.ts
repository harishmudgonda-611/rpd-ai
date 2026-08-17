import test from 'node:test';
import assert from 'node:assert/strict';
import { extractWithBrowser } from './browser-extractor.js';
import type { BrowserProvider } from './browser-provider.js';

test('reports unavailable browser provider safely', async () => {
  const result = await extractWithBrowser('https://example.com');

  assert.equal(result.method, 'browser');
  assert.equal(result.success, false);
  assert.equal(result.success, false);
  assert.match(
    result.error ?? '',
    /browser provider/i,
  );
});

test('extracts product data through an injected browser provider', async () => {
  const provider: BrowserProvider = {
    name: 'test-browser',

    async available() {
      return true;
    },

    async fetch() {
      return {
        finalUrl: 'https://example.com/product',
        html: `
          <html>
            <head>
              <title>Test Kurti</title>
              <meta property="og:image"
                    content="https://cdn.example.com/kurti.jpg">
            </head>
            <body>
              <h1>Test Kurti</h1>
            </body>
          </html>
        `,
      };
    },
  };

  const result = await extractWithBrowser(
    'https://example.com/product',
    provider,
  );

  assert.equal(result.method, 'browser');
  assert.equal(result.success, true);
  assert.ok(result.product);
  assert.equal(result.product.title.value, 'Test Kurti');
  assert.equal(result.product.images.length, 1);
});

test('does not invent data when browser page contains no product evidence', async () => {
  const provider: BrowserProvider = {
    name: 'empty-browser',

    async available() {
      return true;
    },

    async fetch() {
      return {
        finalUrl: 'https://example.com',
        html: '<html><body>Access denied</body></html>',
      };
    },
  };

  const result = await extractWithBrowser(
    'https://example.com',
    provider,
  );

  assert.equal(result.success, false);
  assert.equal(result.success, false);
});
