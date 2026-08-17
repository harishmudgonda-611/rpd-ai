import test from 'node:test';
import assert from 'node:assert/strict';
import { selectBestModelAsset } from './asset-selector.js';
import type { ModelAsset } from './types.js';

const asset = (
  id: string,
  overrides: Partial<ModelAsset> = {},
): ModelAsset => ({
  id,
  path: `/models/${id}.png`,
  type: 'image',
  width: 1080,
  height: 1600,
  pose: 'front',
  framing: 'full-body',
  background: 'studio',
  categories: ['kurti'],
  qualityScore: 0.9,
  confidence: 0.9,
  source: 'local-library',
  warnings: [],
  ...overrides,
});

test('selects the highest compatible model asset', () => {
  const result = selectBestModelAsset(
    [
      asset('aaa', { pose: 'back' }),
      asset('bbb'),
      asset('ccc', { background: 'outdoor' }),
    ],
    {
      category: 'kurti',
      preferredPose: 'front',
      preferredFraming: 'full-body',
      requiredBackground: 'studio',
    },
  );

  assert.equal(result.asset?.id, 'bbb');
  assert.ok(result.score > 0.8);
  assert.ok(result.reasons.includes('category:kurti'));
  assert.ok(result.reasons.includes('pose:front'));
  assert.ok(result.reasons.includes('framing:full-body'));
  assert.ok(result.reasons.includes('background:studio'));
});

test('returns null when registry has no assets', () => {
  const result = selectBestModelAsset([], { category: 'kurti' });

  assert.equal(result.asset, null);
  assert.equal(result.score, 0);
  assert.ok(result.warnings.includes('No model assets are available.'));
});

test('does not claim unknown metadata is an exact match', () => {
  const result = selectBestModelAsset(
    [
      asset('unknown', {
        pose: 'unknown',
        framing: 'unknown',
        background: 'unknown',
      }),
    ],
    {
      preferredPose: 'front',
      preferredFraming: 'full-body',
      requiredBackground: 'studio',
    },
  );

  assert.equal(result.asset?.id, 'unknown');
  assert.ok(!result.reasons.includes('pose:front'));
  assert.ok(!result.reasons.includes('framing:full-body'));
  assert.ok(!result.reasons.includes('background:studio'));
});
