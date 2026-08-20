import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export type ContentPerformance = {
  contentId: string;
  platform: 'instagram' | 'youtube-shorts' | 'whatsapp' | string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followersGained: number;
  impressions?: number;
  watchTimeSeconds?: number;
  completionRatePercent?: number;
};

export type AffiliateClick = {
  clickId: string;
  contentId: string;
  productId: string;
  affiliateNetwork: string;
  affiliateLink: string;
  trackingId: string;
  platform: string;
  campaign?: string;
  creativeId?: string;
  timestamp: string;
};

export type AffiliateOrder = {
  orderId: string;
  contentId: string;
  productId: string;
  clickId?: string;
  affiliateNetwork: string;
  orderTimestamp: string;
  orderStatus: 'pending' | 'confirmed' | 'cancelled' | 'returned';
  orderValue: number;
  commission: number;
  commissionStatus: 'pending' | 'confirmed' | 'cancelled';
  currency: string;
};

export type LearningSignal = {
  signalId: string;
  contentId: string;
  productId: string;
  platform: string;
  format: 'carousel' | 'reel' | 'short';
  hookType: string;
  ctaType: string;
  creativeAngle: string;
  template: string;
  views: number;
  clicks: number;
  orders: number;
  commission: number;
  epc: number;
  recordedAt: string;
};

const DATA_DIR = join(process.cwd(), 'data', 'bi');

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  await ensureDir();
  try {
    const raw = await readFile(join(DATA_DIR, filename), 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  await ensureDir();
  await writeFile(join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
}

export async function logViews(perf: ContentPerformance): Promise<ContentPerformance> {
  const list = await readJsonFile<ContentPerformance[]>('performance.json', []);
  const existingIdx = list.findIndex(p => p.contentId === perf.contentId && p.platform === perf.platform);
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...perf };
  } else {
    list.push(perf);
  }
  await writeJsonFile('performance.json', list);
  return perf;
}

export async function getPerformance(): Promise<ContentPerformance[]> {
  return readJsonFile<ContentPerformance[]>('performance.json', []);
}

export async function logClick(click: Partial<AffiliateClick> & { contentId: string; productId: string }): Promise<AffiliateClick> {
  const list = await readJsonFile<AffiliateClick[]>('clicks.json', []);
  const entry: AffiliateClick = {
    clickId: click.clickId || `click_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    contentId: click.contentId,
    productId: click.productId,
    affiliateNetwork: click.affiliateNetwork || 'generic',
    affiliateLink: click.affiliateLink || '',
    trackingId: click.trackingId || `trk_${click.contentId}`,
    platform: click.platform || 'instagram',
    campaign: click.campaign || 'rpd-campaign',
    creativeId: click.creativeId || 'default-creative',
    timestamp: click.timestamp || new Date().toISOString()
  };
  list.push(entry);
  await writeJsonFile('clicks.json', list);
  return entry;
}

export async function getClicks(): Promise<AffiliateClick[]> {
  return readJsonFile<AffiliateClick[]>('clicks.json', []);
}

export async function logOrder(order: Partial<AffiliateOrder> & { contentId: string; productId: string; orderValue: number; commission: number }): Promise<AffiliateOrder> {
  const list = await readJsonFile<AffiliateOrder[]>('orders.json', []);
  const entry: AffiliateOrder = {
    orderId: order.orderId || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    contentId: order.contentId,
    productId: order.productId,
    clickId: order.clickId || undefined,
    affiliateNetwork: order.affiliateNetwork || 'generic',
    orderTimestamp: order.orderTimestamp || new Date().toISOString(),
    orderStatus: order.orderStatus || 'confirmed',
    orderValue: order.orderValue,
    commission: order.commission,
    commissionStatus: order.commissionStatus || 'confirmed',
    currency: order.currency || 'INR'
  };
  list.push(entry);
  await writeJsonFile('orders.json', list);
  return entry;
}

export async function getOrders(): Promise<AffiliateOrder[]> {
  return readJsonFile<AffiliateOrder[]>('orders.json', []);
}

export async function logLearningSignal(signal: LearningSignal): Promise<LearningSignal> {
  const list = await readJsonFile<LearningSignal[]>('learning_signals.json', []);
  list.push(signal);
  await writeJsonFile('learning_signals.json', list);
  return signal;
}

export async function getLearningSignals(): Promise<LearningSignal[]> {
  return readJsonFile<LearningSignal[]>('learning_signals.json', []);
}
