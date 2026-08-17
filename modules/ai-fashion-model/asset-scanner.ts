import { createHash } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

export const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.bmp',
]);

export type ScannedAsset = {
  id: string;
  path: string;
  relativePath: string;
  extension: string;
};

function assetId(relativePath: string): string {
  return createHash('sha256')
    .update(relativePath.replaceAll('\\', '/').toLowerCase())
    .digest('hex')
    .slice(0, 16);
}

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
      continue;
    }

    if (!entry.isFile()) continue;

    const extension = extname(entry.name).toLowerCase();

    if (SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function scanModelAssets(
  rootDirectory: string,
): Promise<ScannedAsset[]> {
  const files = await walk(rootDirectory);

  return files
    .map((path) => {
      const relativePath = relative(rootDirectory, path);

      return {
        id: assetId(relativePath),
        path,
        relativePath,
        extension: extname(path).toLowerCase(),
      };
    })
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
