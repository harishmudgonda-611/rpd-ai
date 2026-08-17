import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRPD } from './orchestrator.js';
import type { NormalizedProduct } from '../../src/types.js';

const product: NormalizedProduct = {
  sourceUrl: 'https://example.com/kurti',
  canonicalUrl: { value: 'https://example.com/kurti', source: 'canonical', confidence: 1 },
  title: { value: 'Printed Kurti', source: 'jsonld', confidence: 1 },
  brand: { value: 'RPD Brand', source: 'jsonld', confidence: 1 },
  description: { value: 'A printed everyday kurti.', source: 'jsonld', confidence: 1 },
  price: { value: 799, source: 'jsonld', confidence: 1 },
  currency: { value: 'INR', source: 'jsonld', confidence: 1 },
  mrp: { value: 1499, source: 'jsonld', confidence: 1 },
  discountPercent: { value: 47, source: 'jsonld', confidence: 1 },
  availability: { value: 'InStock', source: 'jsonld', confidence: 1 },
  category: { value: 'kurti', source: 'jsonld', confidence: 1 },
  images: [{ url: 'https://example.com/product.jpg', source: 'jsonld' }],
  colors: [{ name: 'Pink', source: 'jsonld' }, { name: 'Blue', source: 'jsonld' }],
  sizes: [{ name: 'M', source: 'jsonld' }, { name: 'L', source: 'jsonld' }],
  variants: [],
  rating: { value: 4.2, source: 'jsonld', confidence: 1 },
  reviewCount: { value: 100, source: 'jsonld', confidence: 1 },
  seller: { value: 'Example Seller', source: 'jsonld', confidence: 1 },
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

test('runs the complete RPD generation pipeline', () => {
  const result = generateRPD({
    product,
    content: {
      angle: 'price',
      cta: 'shop-now',
      slideCount: 6,
    },
    template: 'rpd-pink-deal',
  });

  assert.equal(result.product.title.value, 'Printed Kurti');
  assert.equal(result.variants.uniqueColorCount, 2);
  assert.equal(result.content.carousel.length, 6);
  assert.equal(result.carousel.width, 1080);
  assert.equal(result.carousel.height, 1350);
  assert.equal(result.carousel.template, 'rpd-pink-deal');
  assert.ok(result.carousel.slides.length >= 4);
  assert.equal(
    result.carousel.slides[0].role,
    'hook',
  );
});

test('pipeline preserves missing product facts', () => {
  const incomplete = {
    ...product,
    price: { value: null, source: null, confidence: 0 },
    mrp: { value: null, source: null, confidence: 0 },
    colors: [],
  };

  const result = generateRPD({ product: incomplete });

  assert.equal(result.content.carousel.some((slide) =>
    slide.role === 'price' &&
    slide.body?.includes('MRP') &&
    slide.body?.includes('% off')
  ), false);

  assert.ok(result.warnings.length > 0);
});
