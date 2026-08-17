import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeProductAssets } from './analyzer.js';

test('selects a trustworthy product image', () => {
  const result = analyzeProductAssets([
    {
      url: 'https://cdn.example.com/products/pink-kurti.jpg',
      source: 'jsonld',
    },
  ]);

  assert.ok(result.primaryImage);
  assert.equal(result.productImages.length, 1);
  assert.equal(result.rejectedImages.length, 0);
});

test('rejects obvious platform logos', () => {
  const result = analyzeProductAssets([
    {
      url: 'https://www.akamai.com/site/images/akamai-logo1.svg',
      source: 'dom',
    },
  ]);

  assert.equal(result.primaryImage, null);
  assert.equal(result.productImages.length, 0);
  assert.equal(result.rejectedImages.length, 1);
  assert.ok(
    result.warnings.some((warning) =>
      warning.includes('No trustworthy product image'),
    ),
  );
});

test('keeps valid product images while rejecting junk assets', () => {
  const result = analyzeProductAssets([
    {
      url: 'https://cdn.example.com/logo.svg',
      source: 'dom',
    },
    {
      url: 'https://cdn.example.com/products/floral-kurti.webp',
      source: 'jsonld',
    },
  ]);

  assert.equal(result.productImages.length, 1);
  assert.equal(result.rejectedImages.length, 1);
  assert.equal(
    result.primaryImage?.url,
    'https://cdn.example.com/products/floral-kurti.webp',
  );
});

test('does not invent product assets', () => {
  const result = analyzeProductAssets([]);

  assert.equal(result.primaryImage, null);
  assert.equal(result.productImages.length, 0);
  assert.equal(result.confidence, 0);
});
