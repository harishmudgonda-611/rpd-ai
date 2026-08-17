import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeVariants, mergeImageColorEvidence, normalizeColorName } from './analyzer.js';

test('normalizes common fashion colour aliases', () => {
  assert.equal(normalizeColorName('Wine'), 'maroon');
  assert.equal(normalizeColorName('Navy Blue'), 'navy blue');
  assert.equal(normalizeColorName('Grey'), 'grey');
});

test('deduplicates explicit colour variants', () => {
  const result = analyzeVariants([
    { name: 'Wine', color: 'Wine', size: 'M', sku: 'A1' },
    { name: 'Maroon', color: 'Maroon', size: 'M', sku: 'A2' },
    { name: 'Pink', color: 'Pink', size: 'M', sku: 'A3' }
  ]);
  assert.equal(result.variants.length, 3);
  assert.equal(result.uniqueColorCount, 2);
  assert.deepEqual(result.colors.map(c => c.normalizedName), ['maroon', 'pink']);
});

test('creates variants from colour list when no SKU variants exist', () => {
  const result = analyzeVariants([], ['Black', 'Pink', 'Green']);
  assert.equal(result.variants.length, 3);
  assert.equal(result.uniqueColorCount, 3);
  assert.ok(result.variants.every(v => v.source === 'explicit-product-data'));
});

test('merges visual colour evidence without duplicating known colours', () => {
  const base = analyzeVariants([], ['Black', 'Pink']);
  const result = mergeImageColorEvidence(base, [
    { name: 'Black', hex: '#111111', confidence: 0.88 },
    { name: 'Lavender', hex: '#B57EDC', confidence: 0.91 }
  ]);
  assert.equal(result.uniqueColorCount, 3);
  assert.equal(result.colors.find(c => c.normalizedName === 'black')?.hex, '#111111');
  assert.equal(result.colors.find(c => c.normalizedName === 'lavender')?.source, 'image-analysis');
});
