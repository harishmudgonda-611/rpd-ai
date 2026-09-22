import { randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export type AffiliateLink = {
  id: string;
  productId: string;
  network: string;
  destinationUrl: string;
  label?: string;
  createdAt: string;
  clicks: number;
};

const FILE = join(process.cwd(), 'data', 'affiliate-links.json');

async function readAll(): Promise<AffiliateLink[]> {
  await mkdir(join(process.cwd(), 'data'), { recursive: true });
  try { return JSON.parse(await readFile(FILE, 'utf8')); } catch { return []; }
}
async function writeAll(items: AffiliateLink[]) {
  await mkdir(join(process.cwd(), 'data'), { recursive: true });
  await writeFile(FILE, JSON.stringify(items, null, 2), 'utf8');
}

function validHttpUrl(value: string): boolean {
  try { const u = new URL(value); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; }
}

export async function createAffiliateLink(input: Omit<AffiliateLink, 'id'|'createdAt'|'clicks'>): Promise<AffiliateLink> {
  if (!input.productId || !input.network || !validHttpUrl(input.destinationUrl)) throw new Error('Invalid affiliate link');
  const item: AffiliateLink = {
    ...input,
    id: randomBytes(9).toString('base64url'),
    createdAt: new Date().toISOString(),
    clicks: 0
  };
  const all = await readAll();
  all.push(item);
  await writeAll(all);
  return item;
}

export async function getAffiliateLink(id: string): Promise<AffiliateLink | null> {
  const all = await readAll();
  return all.find(x => x.id === id) ?? null;
}

export async function listAffiliateLinks(): Promise<AffiliateLink[]> { return readAll(); }

export async function registerAffiliateClick(id: string): Promise<AffiliateLink | null> {
  const all = await readAll();
  const item = all.find(x => x.id === id);
  if (!item) return null;
  item.clicks += 1;
  await writeAll(all);
  return item;
}
