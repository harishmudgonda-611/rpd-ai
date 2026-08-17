import test from 'node:test';
import assert from 'node:assert/strict';
import { RPD_TEMPLATES } from './registry.js';
import { selectTemplate } from './selector.js';

test('contains five original built-in RPD templates', () => {
  assert.equal(RPD_TEMPLATES.length, 5);
  assert.equal(new Set(RPD_TEMPLATES.map((t) => t.id)).size, 5);
});

test('selects deal template for verified conversion opportunity', () => {
  const result = selectTemplate({
    angle: 'price',
    objective: 'conversion',
    category: 'kurti',
    hasPriceEvidence: true,
    hasProductImages: true,
    hasModelAsset: true,
    imageCount: 3,
  });

  assert.equal(result.template.id, 'rpd-pink-deal');
  assert.ok(result.score > 0.7);
});

test('selects model-focused template for trend discovery', () => {
  const result = selectTemplate({
    angle: 'trend',
    objective: 'discovery',
    category: 'dress',
    hasPriceEvidence: false,
    hasProductImages: true,
    hasModelAsset: true,
    imageCount: 2,
  });

  assert.equal(result.template.id, 'rpd-lookbook');
});

test('does not pretend missing images satisfy template requirements', () => {
  const result = selectTemplate({
    angle: 'style',
    objective: 'discovery',
    category: 'kurti',
    hasPriceEvidence: false,
    hasProductImages: false,
    hasModelAsset: false,
    imageCount: 0,
  });

  assert.ok(result.warnings.length > 0);
});
