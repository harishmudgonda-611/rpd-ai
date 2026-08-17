import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import type {
  ModelAsset,
  ModelBackground,
  ModelFraming,
  ModelPose,
} from './types.js';
import type { ScannedAsset } from './asset-scanner.js';

type ImageDimensions = {
  width: number;
  height: number;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function inferPose(path: string): { pose: ModelPose; confidence: number } {
  const value = normalize(path);

  if (containsAny(value, ['three quarter', 'threequarter', '3 4', '3q'])) {
    return { pose: 'three-quarter', confidence: 0.72 };
  }

  if (containsAny(value, ['front', 'frontal', 'face front'])) {
    return { pose: 'front', confidence: 0.72 };
  }

  if (containsAny(value, ['back', 'rear'])) {
    return { pose: 'back', confidence: 0.72 };
  }

  if (containsAny(value, ['side', 'profile'])) {
    return { pose: 'side', confidence: 0.72 };
  }

  return { pose: 'unknown', confidence: 0.2 };
}

function inferFraming(path: string): {
  framing: ModelFraming;
  confidence: number;
} {
  const value = normalize(path);

  if (containsAny(value, ['full body', 'fullbody', 'full length', 'full'])) {
    return { framing: 'full-body', confidence: 0.68 };
  }

  if (containsAny(value, ['three quarter', 'threequarter', '3 4'])) {
    return { framing: 'three-quarter-body', confidence: 0.62 };
  }

  if (containsAny(value, ['upper body', 'upperbody', 'waist'])) {
    return { framing: 'upper-body', confidence: 0.68 };
  }

  if (containsAny(value, ['close up', 'closeup', 'portrait'])) {
    return { framing: 'close-up', confidence: 0.68 };
  }

  return { framing: 'unknown', confidence: 0.2 };
}

function inferBackground(path: string): {
  background: ModelBackground;
  confidence: number;
} {
  const value = normalize(path);

  if (containsAny(value, ['studio', 'seamless'])) {
    return { background: 'studio', confidence: 0.65 };
  }

  if (containsAny(value, ['plain', 'white', 'background'])) {
    return { background: 'plain', confidence: 0.6 };
  }

  if (containsAny(value, ['outdoor', 'outside', 'street'])) {
    return { background: 'outdoor', confidence: 0.65 };
  }

  if (containsAny(value, ['interior', 'indoor', 'room'])) {
    return { background: 'interior', confidence: 0.65 };
  }

  return { background: 'unknown', confidence: 0.2 };
}

function inferCategories(path: string): string[] {
  const value = normalize(path);
  const categories: string[] = [];

  const categoryMap: Record<string, string[]> = {
    saree: ['saree'],
    kurti: ['kurti', 'kurta'],
    dress: ['dress', 'gown'],
    top: ['top', 'shirt', 'blouse'],
    jeans: ['jeans', 'denim'],
    lehenga: ['lehenga'],
    ethnic: ['ethnic', 'traditional'],
    western: ['western'],
  };

  for (const [category, terms] of Object.entries(categoryMap)) {
    if (containsAny(value, terms)) {
      categories.push(category);
    }
  }

  return [...new Set(categories)];
}

function parsePng(buffer: Buffer): ImageDimensions | null {
  if (
    buffer.length < 24 ||
    buffer.readUInt32BE(0) !== 0x89504e47
  ) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function parseJpeg(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;

  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = buffer[offset + 1];

    if (
      marker === 0xd8 ||
      marker === 0xd9
    ) {
      offset += 2;
      continue;
    }

    if (offset + 4 > buffer.length) return null;

    const length = buffer.readUInt16BE(offset + 2);

    if (length < 2 || offset + 2 + length > buffer.length) {
      return null;
    }

    const isFrame =
      marker >= 0xc0 &&
      marker <= 0xc3;

    if (isFrame) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + length;
  }

  return null;
}

async function readDimensions(path: string): Promise<ImageDimensions | null> {
  const extension = extname(path).toLowerCase();

  if (extension !== '.png' && extension !== '.jpg' && extension !== '.jpeg') {
    return null;
  }

  const buffer = await readFile(path);

  if (extension === '.png') {
    return parsePng(buffer);
  }

  return parseJpeg(buffer);
}

function qualityScore(
  dimensions: ImageDimensions | null,
  pose: ModelPose,
  framing: ModelFraming,
): number {
  let score = 0.5;

  if (dimensions) {
    const pixels = dimensions.width * dimensions.height;

    if (pixels >= 1_000_000) score += 0.2;
    else if (pixels >= 500_000) score += 0.1;
  }

  if (pose !== 'unknown') score += 0.1;
  if (framing !== 'unknown') score += 0.1;

  return Math.min(1, Number(score.toFixed(2)));
}

export async function analyzeModelAsset(
  scanned: ScannedAsset,
): Promise<ModelAsset> {
  const pose = inferPose(scanned.relativePath);
  const framing = inferFraming(scanned.relativePath);
  const background = inferBackground(scanned.relativePath);
  const categories = inferCategories(scanned.relativePath);
  const dimensions = await readDimensions(scanned.path);

  const warnings: string[] = [];

  if (!dimensions) {
    warnings.push('Image dimensions unavailable locally.');
  }

  if (pose.pose === 'unknown') {
    warnings.push('Pose inferred as unknown; visual verification may be required.');
  }

  if (framing.framing === 'unknown') {
    warnings.push(
      'Framing inferred as unknown; visual verification may be required.',
    );
  }

  if (categories.length === 0) {
    warnings.push(
      'No product-category hint found in the asset path or filename.',
    );
  }

  const confidence = Number(
    (
      (pose.confidence + framing.confidence + background.confidence) /
      3
    ).toFixed(2),
  );

  return {
    id: scanned.id,
    path: scanned.path,
    type: 'image',
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
    pose: pose.pose,
    framing: framing.framing,
    background: background.background,
    categories,
    qualityScore: qualityScore(dimensions, pose.pose, framing.framing),
    confidence,
    source: 'local-library',
    warnings,
  };
}
