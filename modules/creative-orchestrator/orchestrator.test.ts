import test from 'node:test';
import assert from 'node:assert/strict';
import { planCreative } from './orchestrator.js';
import type { NormalizedProduct } from '../../src/types.js';

const product: NormalizedProduct = {
  sourceUrl: 'https://example.com/product',
  canonicalUrl: { value: 'https://example.com/product', source: 'canonical', confidence: 1 },
  title: { value: 'Printed Kurti', source: 'jsonld', confidence: 1 },
  brand: { value: 'RPD Brand', source: 'jsonld', confidence: 1 },
  description: { value: 'Printed everyday kurti', source: 'jsonld', confidence: 1 },
  price: { value: 799, source: 'jsonld', confidence: 1 },
  currency: { value: 'INR', source: 'jsonld', confidence: 1 },
  mrp: { value: 1499, source: 'jsonld', confidence: 1 },
  discountPercent: { value: 47, source: 'jsonld', confidence: 1 },
  availability: { value: 'InStock', source: 'jsonld', confidence: 1 },
  category: { value: 'kurti', source: 'jsonld', confidence: 1 },
  images: [],
  colors: [{ name: 'Pink', source: 'jsonld' }],
  sizes: [{ name: 'M', source: 'jsonld' }],
  variants: [],
  rating: { value: null, source: null, confidence: 0 },
  reviewCount: { value: null, source: null, confidence: 0 },
  seller: { value: 'Example', source: 'jsonld', confidence: 1 },
  rawSignals: {},
  extraction: {
    method: 'test',
    fetchedAt: new Date().toISOString(),
    fieldsFound: 10,
    fieldsExpected: 10,
    confidence: 1,
    warnings: [],
  },
};

test('creates a conversion-focused creative plan', () => {
  const result = planCreative({ product });

  assert.equal(result.concept.intent.objective, 'conversion');
  assert.equal(result.concept.intent.angle, 'price');
  assert.equal(result.concept.intent.cta, 'shop-now');
  assert.equal(result.concept.intent.template, 'rpd-pink-deal');
  assert.equal(result.content.carousel.length, 6);
  assert.ok(result.steps.length >= 6);
});

test('respects explicit creative controls', () => {
  const result = planCreative({
    product,
    angle: 'occasion',
    cta: 'save-post',
    template: 'rpd-lookbook',
    audience: 'college fashion shoppers',
    objective: 'engagement',
  });

  assert.equal(result.concept.intent.angle, 'occasion');
  assert.equal(result.concept.intent.cta, 'save-post');
  assert.equal(result.concept.intent.template, 'rpd-lookbook');
  assert.equal(result.concept.intent.audience, 'college fashion shoppers');
  assert.equal(result.concept.intent.objective, 'engagement');
});

test('does not invent missing price evidence', () => {
  const incomplete = {
    ...product,
    price: { value: null, source: null, confidence: 0 },
    mrp: { value: null, source: null, confidence: 0 },
    discountPercent: { value: null, source: null, confidence: 0 },
  };

  const result = planCreative({ product: incomplete });

  assert.notEqual(result.concept.intent.angle, 'price');
  assert.ok(result.content.warnings.some((warning) =>
    warning.toLowerCase().includes('price'),
  ));
});
