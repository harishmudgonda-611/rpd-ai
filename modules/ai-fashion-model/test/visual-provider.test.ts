import test from 'node:test';
import assert from 'node:assert/strict';
import { FallbackBackgroundRemovalProvider } from '../src/bg-removal-provider.js';
import { DefaultTryOnProvider } from '../src/try-on-provider.js';
import { compositeProductOnBackdrop } from '../src/compositor.js';

test('FallbackBackgroundRemovalProvider returns original image URL with confidence', async () => {
  const provider = new FallbackBackgroundRemovalProvider();
  const res = await provider.removeBackground('https://img.test/kurti.jpg');
  assert.equal(res.cutoutUrl, 'https://img.test/kurti.jpg');
  assert.ok(res.confidence > 0.5);
});

test('DefaultTryOnProvider processes try-on request correctly', async () => {
  const provider = new DefaultTryOnProvider();
  const res = await provider.generateTryOn({ garmentImageUrl: 'https://img.test/dress.jpg' });
  assert.equal(res.tryOnImageUrl, 'https://img.test/dress.jpg');
  assert.equal(res.provider, 'default-try-on-adapter');
});

test('compositeProductOnBackdrop synthesizes composite result', async () => {
  const res = await compositeProductOnBackdrop({
    productCutoutUrl: 'https://img.test/cutout.png',
    backdropTheme: 'warm-studio',
  });
  assert.equal(res.width, 1080);
  assert.equal(res.height, 1350);
  assert.equal(res.theme, 'warm-studio');
});
