import test from 'node:test';
import assert from 'node:assert/strict';
import { extractWithAdapters } from './router.js';

test('rejects invalid URLs without inventing product data', async () => {
  await assert.rejects(
    () => extractWithAdapters('not-a-url'),
    /Product extraction failed/,
  );
});

test('keeps browser extraction as an explicit fallback contract', async () => {
  await assert.rejects(
    () =>
      extractWithAdapters(
        'https://example.invalid/product',
      ),
    /No configured extraction adapter produced trustworthy product data/,
  );
});
