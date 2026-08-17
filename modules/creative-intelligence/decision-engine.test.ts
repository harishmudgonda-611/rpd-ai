import test from 'node:test';
import assert from 'node:assert/strict';
import { decideCreative } from './decision-engine.js';
import type { NormalizedProduct } from '../../src/types.js';

const baseProduct: NormalizedProduct = {
  sourceUrl: 'https://example.com/product',
  canonicalUrl: {
    value: 'https://example.com/product',
    source: 'canonical',
    confidence: 1,
  },
  title: {
    value: 'Printed Kurti',
    source: 'jsonld',
    confidence: 1,
  },
  brand: {
    value: 'RPD Brand',
    source: 'jsonld',
    confidence: 1,
  },
  description: {
    value: 'Printed everyday kurti',
    source: 'jsonld',
    confidence: 1,
  },
  price: {
    value: 799,
    source: 'jsonld',
    confidence: 1,
  },
  currency: {
    value: 'INR',
    source: 'jsonld',
    confidence: 1,
  },
  mrp: {
    value: 1499,
    source: 'jsonld',
    confidence: 1,
  },
  discountPercent: {
    value: 47,
    source: 'jsonld',
    confidence: 1,
  },
  availability: {
    value: 'InStock',
    source: 'jsonld',
    confidence: 1,
  },
  category: {
    value: 'kurti',
    source: 'jsonld',
    confidence: 1,
  },
  images: [
    {
      url: 'https://example.com/product.jpg',
      source: 'jsonld',
    },
  ],
  colors: [
    {
      name: 'Pink',
      source: 'jsonld',
    },
  ],
  sizes: [
    {
      name: 'M',
      source: 'jsonld',
    },
  ],
  variants: [],
  rating: {
    value: null,
    source: null,
    confidence: 0,
  },
  reviewCount: {
    value: null,
    source: null,
    confidence: 0,
  },
  seller: {
    value: 'Example',
    source: 'jsonld',
    confidence: 1,
  },
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

test('selects price-led conversion when verified discount evidence exists', () => {
  const result = decideCreative({
    product: baseProduct,
  });

  assert.equal(result.angle, 'price');
  assert.equal(result.objective, 'conversion');
  assert.equal(result.cta, 'shop-now');
  assert.equal(result.template, 'rpd-pink-deal');
  assert.ok(result.score > 0.7);
  assert.ok(result.confidence > 0.7);
});

test('does not select price when price evidence is incomplete', () => {
  const product = {
    ...baseProduct,
    price: {
      value: null,
      source: null,
      confidence: 0,
    },
    mrp: {
      value: null,
      source: null,
      confidence: 0,
    },
    discountPercent: {
      value: null,
      source: null,
      confidence: 0,
    },
  };

  const result = decideCreative({ product });

  assert.notEqual(result.angle, 'price');
  assert.equal(result.objective, 'discovery');
});

test('respects explicit creative decisions', () => {
  const result = decideCreative({
    product: baseProduct,
    preferredAngle: 'occasion',
    preferredCTA: 'save-post',
    preferredTemplate: 'rpd-lookbook',
    objective: 'engagement',
  });

  assert.equal(result.angle, 'occasion');
  assert.equal(result.cta, 'save-post');
  assert.equal(result.template, 'rpd-lookbook');
  assert.equal(result.objective, 'engagement');
});

test('returns auditable decision signals', () => {
  const result = decideCreative({
    product: baseProduct,
  });

  assert.ok(result.signals.length >= 5);
  assert.ok(
    result.signals.some((signal) => signal.name === 'price-evidence'),
  );
  assert.ok(result.reasons.length >= 3);
});
