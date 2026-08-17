import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeExtraction } from './analyzer.js';
import { detectPlatform } from './platforms.js';
import { evaluateExtractionQuality } from './quality.js';

function product(overrides: any = {}) {
  return {
    sourceUrl: 'https://www.meesho.com/s/p/test',
    canonicalUrl: {
      value: 'https://www.meesho.com/s/p/test',
      source: 'input-url',
      confidence: 0.95,
    },
    title: {
      value: 'Printed Kurti',
      source: 'jsonld',
      confidence: 1,
    },
    brand: {
      value: 'Test Brand',
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
      source: 'derived',
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
        url: 'https://cdn.example.com/products/kurti.jpg',
        source: 'jsonld',
      },
    ],
    colors: [],
    sizes: [],
    variants: [],
    rating: {
      value: null,
      source: 'dom',
      confidence: 0,
    },
    reviewCount: {
      value: null,
      source: 'dom',
      confidence: 0,
    },
    seller: {
      value: 'Seller',
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
    ...overrides,
  };
}

test('detects major commerce platforms', () => {
  assert.equal(
    detectPlatform('https://www.meesho.com/s/p/test'),
    'meesho',
  );

  assert.equal(
    detectPlatform('https://www.amazon.in/dp/B123'),
    'amazon',
  );

  assert.equal(
    detectPlatform('https://www.flipkart.com/item/p/test'),
    'flipkart',
  );

  assert.equal(
    detectPlatform('https://www.myntra.com/product/test'),
    'myntra',
  );
});

test('recognizes trustworthy product evidence', () => {
  const result = evaluateExtractionQuality(product());

  assert.equal(result.blocked, false);
  assert.equal(result.trustworthy, true);
  assert.ok(result.score >= 0.9);
});

test('rejects incomplete product evidence', () => {
  const result = evaluateExtractionQuality(
    product({
      title: {
        value: null,
        source: 'dom',
        confidence: 0,
      },
      price: {
        value: null,
        source: 'meta/dom',
        confidence: 0,
      },
      images: [],
      category: {
        value: null,
        source: 'dom',
        confidence: 0,
      },
      description: {
        value: null,
        source: 'meta',
        confidence: 0,
      },
    }),
  );

  assert.equal(result.trustworthy, false);
  assert.ok(result.missingFields.includes('title'));
  assert.ok(result.missingFields.includes('price'));
});

test('detects access-blocked extraction', () => {
  const result = evaluateExtractionQuality(
    product({
      title: {
        value: null,
        source: 'dom',
        confidence: 0,
      },
      price: {
        value: null,
        source: 'meta/dom',
        confidence: 0,
      },
      images: [
        {
          url: 'https://www.akamai.com/site/images/akamai-logo1.svg',
          source: 'dom',
        },
      ],
      extraction: {
        method: 'jsonld+opengraph+meta+dom',
        fetchedAt: new Date().toISOString(),
        fieldsFound: 1,
        fieldsExpected: 10,
        confidence: 0.1,
        warnings: [
          'Product title not found',
          'Product price not found',
          'Access denied by upstream provider',
        ],
      },
    }),
  );

  assert.equal(result.blocked, true);
  assert.equal(result.trustworthy, false);
  assert.ok(result.score < 0.3);
});
