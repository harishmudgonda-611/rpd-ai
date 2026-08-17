import test from 'node:test';
import assert from 'node:assert/strict';
import { optimizeDistribution } from './optimizer.js';
import type { CreativeExecutionPlan } from '../creative-orchestrator/types.js';
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
    value: 'A printed everyday kurti.',
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

const creative = {
  product,
  concept: {
    name: 'price-conversion-kurti',
    hook: 'A kurti deal worth a closer look',
    rationale: 'Verified price opportunity.',
    intent: {
      angle: 'price',
      cta: 'shop-now',
      template: 'rpd-pink-deal',
      audience: 'Indian fashion shoppers',
      objective: 'conversion',
    },
    assetRequest: {
      category: 'kurti',
      preferredPose: 'front',
      preferredFraming: 'full-body',
      requiredBackground: 'studio',
    },
  },
  selectedModel: {
    asset: null,
    score: 0,
    reasons: [],
    warnings: ['No model assets are available.'],
  },
  content: null,
  steps: [],
  warnings: ['No model assets are available.'],
} satisfies CreativeExecutionPlan;

test('creates Instagram-ready distribution metadata', () => {
  const result = optimizeDistribution({
    platform: 'instagram',
    creative,
    productUrl: product.sourceUrl,
  });

  assert.equal(result.platform, 'instagram');
  assert.equal(result.metadata.aspectRatio, '9:16');
  assert.equal(result.metadata.width, 1080);
  assert.equal(result.metadata.height, 1920);
  assert.ok(result.metadata.caption.includes('Printed Kurti'));
  assert.ok(result.metadata.hashtags.includes('kurti'));
  assert.equal(result.metadata.cta, 'Shop now');
});

test('creates YouTube Shorts metadata without changing the canonical URL', () => {
  const result = optimizeDistribution({
    platform: 'youtube-shorts',
    creative,
    productUrl: product.sourceUrl,
  });

  assert.ok(result.metadata.title.includes('Printed Kurti'));
  assert.ok(
    result.metadata.caption.includes('https://example.com/kurti'),
  );
  assert.ok(
    result.reasons.includes('canonical-product-url-preserved'),
  );
});

test('uses WhatsApp-specific CTA', () => {
  const result = optimizeDistribution({
    platform: 'whatsapp',
    creative,
    productUrl: product.sourceUrl,
  });

  assert.equal(
    result.metadata.cta,
    'Join WhatsApp for daily deals',
  );
});

test('does not invent product facts', () => {
  const incomplete = {
    ...creative,
    product: {
      ...product,
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
    },
  } satisfies CreativeExecutionPlan;

  const result = optimizeDistribution({
    platform: 'instagram',
    creative: incomplete,
    productUrl: product.sourceUrl,
  });

  assert.ok(!result.metadata.caption.includes('799'));
  assert.ok(!result.metadata.caption.includes('1499'));
});
