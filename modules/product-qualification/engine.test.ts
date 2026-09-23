import test from 'node:test';
import assert from 'node:assert/strict';
import { qualifyProduct } from './engine.js';

test('qualifies a strong deal as tier A', () => {
  const result = qualifyProduct({
    price: 799,
    mrp: 1999,
    discountPercent: 60,
    imageCount: 5,
    title: 'Women Printed Kurta Set',
    platform: 'myntra'
  });
  assert.equal(result.tier, 'A');
  assert.equal(result.publish, true);
  assert.equal(result.score, 100);
});

test('rejects incomplete product evidence', () => {
  const result = qualifyProduct({ price: 0, imageCount: 1, title: 'Top', platform: 'unknown' });
  assert.equal(result.tier, 'C');
  assert.equal(result.publish, false);
  assert.ok(result.reasons.length >= 3);
});
