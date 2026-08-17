import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanModelAssets } from './asset-scanner.js';

test('recursively scans supported model image files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rpd-models-'));

  await mkdir(join(root, 'women', 'front'), { recursive: true });
  await mkdir(join(root, 'men'), { recursive: true });

  await writeFile(join(root, 'women', 'front', 'model.png'), '');
  await writeFile(join(root, 'men', 'model.webp'), '');
  await writeFile(join(root, 'notes.txt'), 'ignore');

  const assets = await scanModelAssets(root);

  assert.equal(assets.length, 2);
  assert.deepEqual(
    assets.map((asset) => asset.relativePath),
    ['men/model.webp', 'women/front/model.png'],
  );
});

test('creates deterministic asset IDs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rpd-models-'));

  await writeFile(join(root, 'model.png'), '');

  const first = await scanModelAssets(root);
  const second = await scanModelAssets(root);

  assert.equal(first[0]?.id, second[0]?.id);
  assert.match(first[0]?.id ?? '', /^[a-f0-9]{16}$/);
});

test('ignores unsupported file types', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rpd-models-'));

  await writeFile(join(root, 'model.png'), '');
  await writeFile(join(root, 'model.txt'), '');
  await writeFile(join(root, 'model.json'), '');

  const assets = await scanModelAssets(root);

  assert.equal(assets.length, 1);
  assert.equal(assets[0]?.extension, '.png');
});
