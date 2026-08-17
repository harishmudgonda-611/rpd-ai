
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderPlan } from './planner.js';

const product = {
  sourceUrl: 'https://example.com/product',
  canonicalUrl: { value: 'https://example.com/product', source: 'input-url', confidence: 1 },
  title: { value: 'Printed Kurti', source: 'jsonld', confidence: 1 },
  brand: { value: null, source: 'dom', confidence: 0 },
  description: { value: null, source: 'meta', confidence: 0 },
  price: { value: 799, source: 'jsonld', confidence: 1 },
  currency: { value: 'INR', source: 'jsonld', confidence: 1 },
  mrp: { value: 1499, source: 'jsonld', confidence: 1 },
  discountPercent: { value: 47, source: 'derived', confidence: 1 },
  availability: { value: null, source: 'dom', confidence: 0 },
  category: { value: 'kurti', source: 'jsonld', confidence: 1 },
  images: [{ url: 'https://cdn.example.com/kurti.jpg', source: 'jsonld' }],
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
    fieldsFound: 5,
    fieldsExpected: 10,
    confidence: 0.5,
    warnings: [],
  },
};

test('creates 9:16 render plan', () => {
  const result = createRenderPlan({ product });

  assert.equal(result.width, 1080);
  assert.equal(result.height, 1920);
  assert.equal(result.scenes.length, 6);
  assert.equal(result.assets.length, 1);
});

test('does not fabricate unavailable price', () => {
  const result = createRenderPlan({
    product: {
      ...product,
      price: { value: null, source: 'meta/dom', confidence: 0 },
    },
  });

  assert.ok(
    result.warnings.some((x) => x.includes('Price unavailable')),
  );
});
