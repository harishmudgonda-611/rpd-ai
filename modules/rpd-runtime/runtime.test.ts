import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRPDFromUrl } from './runtime.js';

test('rejects missing URL before extraction', async () => {
  await assert.rejects(
    () => generateRPDFromUrl({ url: '' }),
    /url is required/,
  );
});
