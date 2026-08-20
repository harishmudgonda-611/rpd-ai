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
  assert.equal(result.primaryImage.role, 'primary-product');
  assert.equal(result.productImages.length, 1);
  assert.equal(result.rejectedImages.length, 0);
  assert.equal(result.duplicateImages.length, 0);
});

test('rejects navigation banners, promotional banners, and UI graphics', () => {
  const result = analyzeProductAssets([
    {
      url: 'https://constant.myntassets.com/web/assets/img/sudio-nav-banner.png',
      source: 'dom',
    },
    {
      url: 'https://cdn.example.com/assets/header-promo-banner.webp',
      source: 'dom',
    },
    {
      url: 'https://cdn.example.com/assets/chevron-right.svg',
      source: 'dom',
    },
  ]);

  assert.equal(result.primaryImage, null);
  assert.equal(result.productImages.length, 0);
  assert.equal(result.rejectedImages.length, 3);
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
  assert.equal(result.rejectedImages[0].type, 'logo');

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

test('deduplicates equivalent image URLs', () => {
  const result = analyzeProductAssets([
    {
      url: 'https://cdn.example.com/products/kurti.jpg?w=800',
      source: 'jsonld',
    },
    {
      url: 'https://cdn.example.com/products/kurti.jpg?w=1200',
      source: 'dom',
    },
  ]);

  assert.equal(result.productImages.length, 1);
  assert.equal(result.duplicateImages.length, 1);
  assert.equal(
    result.duplicateImages[0].duplicateOf,
    result.primaryImage?.url,
  );
});

test('classifies detail imagery separately from primary imagery', () => {
  const result = analyzeProductAssets([
    {
      url: 'https://cdn.example.com/products/kurti-front.jpg',
      source: 'jsonld',
    },
    {
      url: 'https://cdn.example.com/products/kurti-detail.jpg',
      source: 'jsonld',
    },
  ]);

  assert.ok(result.primaryImage);
  assert.equal(result.primaryImage.role, 'primary-product');

  const detail = result.productImages.find(
    (image) => image.url.includes('detail'),
  );

  assert.ok(detail);
  assert.equal(detail?.role, 'detail');
});

test('does not invent product assets', () => {
  const result = analyzeProductAssets([]);

  assert.equal(result.primaryImage, null);
  assert.equal(result.productImages.length, 0);
  assert.equal(result.rejectedImages.length, 0);
  assert.equal(result.duplicateImages.length, 0);
  assert.equal(result.confidence, 0);
});

test('does not accept a URL merely because it contains an image-like filename', () => {
  const result = analyzeProductAssets([
    {
      url: 'https://cdn.example.com/tracking/product-pixel.svg',
      source: 'dom',
    },
  ]);

  assert.equal(result.primaryImage, null);
  assert.equal(result.productImages.length, 0);
});
