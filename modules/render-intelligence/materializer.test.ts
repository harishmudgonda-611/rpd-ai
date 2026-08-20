import test from 'node:test';
import assert from 'node:assert/strict';
import { materializeAsset } from './materializer.js';

test('materializeAsset safely handles offline local paths', async () => {
  const asset = await materializeAsset('https://cdn.example.com/products/pink-top.jpg');
  assert.equal(asset.originalUrl, 'https://cdn.example.com/products/pink-top.jpg');
  assert.ok(asset.filename.endsWith('.jpg'));
});

test('materializeAsset passes local relative paths untouched', async () => {
  const asset = await materializeAsset('data/images/local.png');
  assert.equal(asset.localPath, 'data/images/local.png');
  assert.equal(asset.success, true);
});
