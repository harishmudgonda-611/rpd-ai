import { mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { createHash } from 'node:crypto';

export type MaterializedAsset = {
  originalUrl: string;
  localPath: string;
  filename: string;
  mimeType: string;
  success: boolean;
};

const CACHE_DIR = join(process.cwd(), 'modules', 'rpd-production', 'output', 'assets');

export async function materializeAsset(url: string): Promise<MaterializedAsset> {
  if (!url || !url.startsWith('http')) {
    return {
      originalUrl: url || '',
      localPath: url || '',
      filename: '',
      mimeType: 'image/jpeg',
      success: true,
    };
  }

  await mkdir(CACHE_DIR, { recursive: true });
  const hash = createHash('sha256').update(url).digest('hex').substring(0, 16);
  let ext = extname(new URL(url).pathname).toLowerCase();
  if (!ext || !['.jpg', '.jpeg', '.png', '.webp', '.svg', '.avif'].includes(ext)) {
    ext = '.jpg';
  }

  const filename = `${hash}${ext}`;
  const localPath = join(CACHE_DIR, filename);

  try {
    const { stat } = await import('node:fs/promises');
    await stat(localPath);
    return {
      originalUrl: url,
      localPath,
      filename,
      mimeType: ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg',
      success: true,
    };
  } catch {
    // File not cached yet, download below
  }

  try {
    const res = await fetch(url, { headers: { 'user-agent': 'RPD-Asset-Materializer/1.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(localPath, buffer);

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return {
      originalUrl: url,
      localPath,
      filename,
      mimeType: contentType,
      success: true,
    };
  } catch {
    // If fetch fails offline or network error, return original URL as fallback
    return {
      originalUrl: url,
      localPath: url,
      filename,
      mimeType: 'image/jpeg',
      success: false,
    };
  }
}

export async function materializeAssets(urls: string[]): Promise<MaterializedAsset[]> {
  return Promise.all(urls.filter(Boolean).map(materializeAsset));
}
