import { createHash } from 'node:crypto';
import { readdir, stat } from 'node:fs/promises';
import { extname, join, relative, basename } from 'node:path';
import type { ModelAsset, ModelPose } from './types.js';

const IMAGE_EXTENSIONS = new Set(['.jpg','.jpeg','.png','.webp','.avif']);
const PNG_SIGNATURE = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);

const poseFromName = (name: string): ModelPose => {
  const n = name.toLowerCase();
  if (/front|straight|standing/.test(n)) return 'front';
  if (/three|3[-_ ]?quarter|45/.test(n)) return 'three-quarter';
  if (/side|profile/.test(n)) return 'side';
  if (/back|rear/.test(n)) return 'back';
  if (/sit|sitting/.test(n)) return 'sitting';
  if (/walk|walking/.test(n)) return 'walking';
  return 'unknown';
};
const categoryTags = (name: string) => {
  const n = name.toLowerCase();
  const tags: string[] = [];
  if (/kurti|top|shirt|blouse|tunic|upper/.test(n)) tags.push('upper_body');
  if (/pant|jean|skirt|lower/.test(n)) tags.push('lower_body');
  if (/dress|saree|gown|onepiece|full/.test(n)) tags.push('full_body','dress');
  return tags.length ? tags : ['unknown'];
};

export async function scanModelAssets(root: string): Promise<ModelAsset[]> {
  const result: ModelAsset[] = [];
  async function walk(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.name.startsWith('.')) continue;
      if (entry.isDirectory()) { await walk(full); continue; }
      const ext = extname(entry.name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) continue;
      const relativePath = relative(root, full).replaceAll('\\','/');
      const assetId = createHash('sha1').update(relativePath).digest('hex').slice(0,12);
      const dimensions = await readImageDimensions(full).catch(() => undefined);
      result.push({ assetId, path: full, filename: basename(full), extension: ext.slice(1), pose: poseFromName(entry.name), tags: categoryTags(entry.name), width: dimensions?.width, height: dimensions?.height, categoryCompatibility: categoryTags(entry.name), source: 'rpd-model-library' });
    }
  }
  await walk(root);
  return result.sort((a,b) => a.filename.localeCompare(b.filename));
}

async function readImageDimensions(path: string): Promise<{width:number;height:number}> {
  const buffer = await import('node:fs/promises').then(fs => fs.readFile(path));
  if (buffer.length < 24) throw new Error('not an image');
  if (buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  if (buffer.subarray(0, 2).equals(Buffer.from('BM'))) return { width: buffer.readInt32LE(18), height: Math.abs(buffer.readInt32LE(22)) };
  if (buffer.subarray(0, 4).equals(Buffer.from('RIFF')) && buffer.subarray(8,12).equals(Buffer.from('WEBP')) && buffer.subarray(12,16).equals(Buffer.from('VP8X'))) return { width: 1 + buffer.readUIntLE(24,3), height: 1 + buffer.readUIntLE(27,3) };
  throw new Error('dimensions unavailable for this format');
}

export function selectBestModelAsset(assets: ModelAsset[], category: string, preferredPose: ModelPose = 'front'): ModelAsset | null {
  const compatible = assets.filter(a => a.categoryCompatibility.includes(category) || a.categoryCompatibility.includes('unknown'));
  const pool = compatible.length ? compatible : assets;
  return [...pool].sort((a,b) => {
    const poseScore = (x: ModelAsset) => x.pose === preferredPose ? 3 : x.pose === 'unknown' ? 1 : 0;
    const dimScore = (x: ModelAsset) => x.width && x.height ? Math.min(x.width, x.height) / 1000 : 0;
    return (poseScore(b) + dimScore(b)) - (poseScore(a) + dimScore(a));
  })[0] ?? null;
}
