import test from 'node:test';
import assert from 'node:assert/strict';
import { ModelAssetRegistry } from './asset-registry.js';
import type { ModelAsset } from './types.js';

const makeAsset = (id: string, category: string): ModelAsset => ({
  id,
  path: `/models/${id}.png`,
  type: 'image',
  width: 1080,
  height: 1600,
  pose: 'front',
  framing: 'full-body',
  background: 'studio',
  categories: [category],
  qualityScore: 0.9,
  confidence: 0.9,
  source: 'local-library',
  warnings: [],
});

test('registers, retrieves, lists and removes assets', () => {
  const registry = new ModelAssetRegistry();
  const first = makeAsset('b', 'kurti');
  const second = makeAsset('a', 'saree');

  registry.addMany([first, second]);

  assert.equal(registry.size, 2);
  assert.equal(registry.get('b')?.id, 'b');
  assert.deepEqual(
    registry.list().map((asset) => asset.id),
    ['a', 'b'],
  );

  assert.equal(registry.remove('b'), true);
  assert.equal(registry.get('b'), null);
  assert.equal(registry.size, 1);
});

test('selects through the registry', () => {
  const registry = new ModelAssetRegistry();

  registry.add(makeAsset('kurti-1', 'kurti'));
  registry.add(makeAsset('saree-1', 'saree'));

  const result = registry.select({
    category: 'saree',
    preferredPose: 'front',
  });

  assert.equal(result.asset?.id, 'saree-1');
});

test('clear removes all assets', () => {
  const registry = new ModelAssetRegistry();
  registry.add(makeAsset('a', 'kurti'));

  registry.clear();

  assert.equal(registry.size, 0);
  assert.deepEqual(registry.list(), []);
});
