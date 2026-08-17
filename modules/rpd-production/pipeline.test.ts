
import test from 'node:test';
import assert from 'node:assert/strict';
import { createProductionManifest } from './pipeline.js';

const product = {
  sourceUrl: 'https://example.com/product',
  canonicalUrl: { value: 'https://example.com/product', source: 'input-url', confidence: 1 },
  title: { value: 'Test Product', source: 'jsonld', confidence: 1 },
  brand: { value: null, source: 'dom', confidence: 0 },
  description: { value: null, source: 'meta', confidence: 0 },
  price: { value: 799, source: 'jsonld', confidence: 1 },
  currency: { value: 'INR', source: 'jsonld', confidence: 1 },
  mrp: { value: 1499, source: 'jsonld', confidence: 1 },
  discountPercent: { value: 47, source: 'derived', confidence: 1 },
  availability: { value: null, source: 'dom', confidence: 0 },
  category: { value: 'fashion', source: 'jsonld', confidence: 1 },
  images: [{ url: 'https://cdn.example.com/product.jpg', source: 'jsonld' }],
  colors: [],
  sizes: [],
  variants: [],
  rating: { value: null, source: 'dom', confidence: 0 },
  reviewCount: { value: null, source: 'dom', confidence: 0 },
  seller: { value: null, source: 'jsonld', confidence: 0 },
  rawSignals: {},
  extraction: {
    method: 'test',
    fetchedAt: new Date().toISOString(),
    fieldsFound: 7,
    fieldsExpected: 10,
    confidence: 0.7,
    warnings: [],
  },
};

test('creates a production-ready manifest', () => {
  const result = createProductionManifest({
    product,
    platform: 'meesho',
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.artifacts.length, 3);
  assert.equal(result.render.aspectRatio, '9:16');
});
