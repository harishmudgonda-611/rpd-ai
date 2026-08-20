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

export async function logViews(rawPerf: any): Promise<ContentPerformance> {
  const perf: ContentPerformance = {
    contentId: rawPerf.content_id || rawPerf.contentId || `c_${Date.now()}`,
    platform: rawPerf.platform || 'instagram',
    publishedAt: rawPerf.published_at || rawPerf.publishedAt || new Date().toISOString(),
    views: Number(rawPerf.views || 0),
    likes: Number(rawPerf.likes || 0),
    comments: Number(rawPerf.comments || 0),
    shares: Number(rawPerf.shares || 0),
    saves: Number(rawPerf.saves || 0),
    followersGained: Number(rawPerf.followers_gained || rawPerf.followersGained || 0),
    impressions: rawPerf.impressions != null ? Number(rawPerf.impressions) : undefined,
    watchTimeSeconds: rawPerf.watch_time_seconds != null ? Number(rawPerf.watch_time_seconds) : rawPerf.watchTimeSeconds != null ? Number(rawPerf.watchTimeSeconds) : undefined,
    completionRatePercent: rawPerf.completion_rate != null ? Number(rawPerf.completion_rate) : rawPerf.completionRatePercent != null ? Number(rawPerf.completionRatePercent) : undefined,
  };

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

export async function getPerformance(filters?: { content_id?: string; platform?: string }): Promise<ContentPerformance[]> {
  let list = await readJsonFile<ContentPerformance[]>('performance.json', []);
  if (filters?.content_id) {
    list = list.filter(p => p.contentId === filters.content_id);
  }
  if (filters?.platform) {
    list = list.filter(p => p.platform === filters.platform);
  }
  return list;
}

export async function logClick(rawClick: any): Promise<AffiliateClick> {
  const list = await readJsonFile<AffiliateClick[]>('clicks.json', []);
  const contentId = rawClick.content_id || rawClick.contentId || `c_${Date.now()}`;
  const productId = rawClick.product_id || rawClick.productId || `p_${Date.now()}`;
  const clickId = rawClick.click_id || rawClick.clickId || `click_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const entry: AffiliateClick = {
    clickId,
    contentId,
    productId,
    affiliateNetwork: rawClick.affiliate_network || rawClick.affiliateNetwork || 'generic',
    affiliateLink: rawClick.affiliate_link || rawClick.affiliateLink || '',
    trackingId: rawClick.tracking_id || rawClick.trackingId || `trk_${contentId}`,
    platform: rawClick.platform || 'instagram',
    campaign: rawClick.campaign || 'rpd-campaign',
    creativeId: rawClick.creative_id || rawClick.creativeId || 'default-creative',
    timestamp: rawClick.clicked_at || rawClick.timestamp || new Date().toISOString()
  };

  const existingIdx = list.findIndex(c => c.clickId === clickId);
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...entry };
  } else {
    list.push(entry);
  }

  await writeJsonFile('clicks.json', list);
  return entry;
}

export async function getClicks(filters?: { content_id?: string; product_id?: string; platform?: string; affiliate_network?: string }): Promise<AffiliateClick[]> {
  let list = await readJsonFile<AffiliateClick[]>('clicks.json', []);
  if (filters?.content_id) {
    list = list.filter(c => c.contentId === filters.content_id);
  }
  if (filters?.product_id) {
    list = list.filter(c => c.productId === filters.product_id);
  }
  if (filters?.platform) {
    list = list.filter(c => c.platform === filters.platform);
  }
  if (filters?.affiliate_network) {
    list = list.filter(c => c.affiliateNetwork === filters.affiliate_network);
  }
  return list;
}

export async function logOrder(rawOrder: any): Promise<AffiliateOrder> {
  const list = await readJsonFile<AffiliateOrder[]>('orders.json', []);
  const orderId = rawOrder.order_id || rawOrder.orderId || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const contentId = rawOrder.content_id || rawOrder.contentId || `c_${Date.now()}`;
  const productId = rawOrder.product_id || rawOrder.productId || `p_${Date.now()}`;

  const entry: AffiliateOrder = {
    orderId,
    contentId,
    productId,
    clickId: rawOrder.click_id || rawOrder.clickId || undefined,
    affiliateNetwork: rawOrder.affiliate_network || rawOrder.affiliateNetwork || 'generic',
    orderTimestamp: rawOrder.order_date || rawOrder.orderTimestamp || new Date().toISOString(),
    orderStatus: rawOrder.order_status || rawOrder.orderStatus || 'confirmed',
    orderValue: Number(rawOrder.order_value ?? rawOrder.orderValue ?? 0),
    commission: Number(rawOrder.commission ?? 0),
    commissionStatus: rawOrder.commission_status || rawOrder.commissionStatus || 'confirmed',
    currency: rawOrder.currency || 'INR'
  };

  const existingIdx = list.findIndex(o => o.orderId === orderId);
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...entry };
  } else {
    list.push(entry);
  }

  await writeJsonFile('orders.json', list);
  return entry;
}

export async function getOrders(filters?: { content_id?: string; product_id?: string; platform?: string; affiliate_network?: string; status?: string }): Promise<AffiliateOrder[]> {
  let list = await readJsonFile<AffiliateOrder[]>('orders.json', []);
  if (filters?.content_id) {
    list = list.filter(o => o.contentId === filters.content_id);
  }
  if (filters?.product_id) {
    list = list.filter(o => o.productId === filters.product_id);
  }
  if (filters?.affiliate_network) {
    list = list.filter(o => o.affiliateNetwork === filters.affiliate_network);
  }
  if (filters?.status) {
    list = list.filter(o => o.orderStatus === filters.status || o.commissionStatus === filters.status);
  }
  return list;
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
