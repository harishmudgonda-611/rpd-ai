import test from 'node:test';
import assert from 'node:assert/strict';
import { planCreative } from './orchestrator.js';
import type { NormalizedProduct } from '../../src/types.js';

const product: NormalizedProduct = {
  sourceUrl: 'https://example.com/kurti',
  canonicalUrl: {
    value: 'https://example.com/kurti',
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
    value: 'Printed everyday kurti.',
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
    value: 4.2,
    source: 'jsonld',
    confidence: 1,
  },
  reviewCount: {
    value: 100,
    source: 'jsonld',
    confidence: 1,
  },
  seller: {
    value: 'Example Seller',
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

test('automatically selects a renderable deal template', () => {
  const result = planCreative({
    product,
    objective: 'conversion',
  });

  assert.equal(result.concept.intent.angle, 'price');
  assert.ok(
    [
      'rpd-pink-deal',
      'rpd-minimal',
      'rpd-colour-grid',
      'rpd-editorial',
      'rpd-lookbook',
    ].includes(result.concept.intent.template),
  );
});

test('explicit template overrides intelligent selection', () => {
  const result = planCreative({
    product,
    objective: 'conversion',
    template: 'rpd-editorial',
  });

  assert.equal(result.concept.intent.template, 'rpd-editorial');
});
