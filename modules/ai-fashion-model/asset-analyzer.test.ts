import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyzeModelAsset } from './asset-analyzer.js';
import type { ScannedAsset } from './asset-scanner.js';

function pngHeader(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(24);

  buffer.writeUInt32BE(0x89504e47, 0);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);

  return buffer;
}

test('analyzes dimensions and filename intelligence', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rpd-analyzer-'));
  const path = join(root, 'kurti', 'front-studio-full-body.png');

  const { mkdir } = await import('node:fs/promises');
  await mkdir(join(root, 'kurti'), { recursive: true });
  await writeFile(path, pngHeader(1080, 1600));

  const scanned: ScannedAsset = {
    id: 'abcdef1234567890',
    path,
    relativePath: 'kurti/front-studio-full-body.png',
    extension: '.png',
  };

  const asset = await analyzeModelAsset(scanned);

  assert.equal(asset.width, 1080);
  assert.equal(asset.height, 1600);
  assert.equal(asset.pose, 'front');
  assert.equal(asset.framing, 'full-body');
  assert.equal(asset.background, 'studio');
  assert.deepEqual(asset.categories, ['kurti']);
  assert.equal(asset.source, 'local-library');
  assert.ok(asset.qualityScore > 0.7);
});

test('does not pretend unknown filename information is known', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rpd-analyzer-'));
  const path = join(root, 'random-model.png');

  await writeFile(path, pngHeader(500, 500));

  const scanned: ScannedAsset = {
    id: '1234567890abcdef',
    path,
    relativePath: 'random-model.png',
    extension: '.png',
  };

  const asset = await analyzeModelAsset(scanned);

  assert.equal(asset.pose, 'unknown');
  assert.equal(asset.framing, 'unknown');
  assert.deepEqual(asset.categories, []);
  assert.ok(asset.warnings.length >= 2);
});
