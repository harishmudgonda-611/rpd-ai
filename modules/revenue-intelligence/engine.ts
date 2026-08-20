import type { ContentPerformance, AffiliateClick, AffiliateOrder } from '../../src/business-intelligence.js';

export type RevenueMetrics = {
  totalViews: number;
  totalClicks: number;
  totalOrders: number;
  totalCommission: number;
  confirmedCommission: number;
  pendingCommission: number;
  cancelledCommission: number;
  conversionRatePercent: number;
  epc: number;
  revenuePer1000Views: number;
};

export function calculateRevenueMetrics(
  perfs: ContentPerformance[] = [],
  clicks: AffiliateClick[] = [],
  orders: AffiliateOrder[] = []
): RevenueMetrics {
  const totalViews = perfs.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalClicks = clicks.length;
  const totalOrders = orders.length;

  let confirmedCommission = 0;
  let pendingCommission = 0;
  let cancelledCommission = 0;

  for (const order of orders) {
    const val = Number(order.commission || 0);
    if (order.commissionStatus === 'confirmed') confirmedCommission += val;
    else if (order.commissionStatus === 'pending') pendingCommission += val;
    else if (order.commissionStatus === 'cancelled') cancelledCommission += val;
    else confirmedCommission += val;
  }

  const totalCommission = confirmedCommission + pendingCommission;
  const conversionRatePercent = totalClicks > 0 ? Number(((totalOrders / totalClicks) * 100).toFixed(2)) : 0;
  const epc = totalClicks > 0 ? Number((totalCommission / totalClicks).toFixed(2)) : 0;
  const revenuePer1000Views = totalViews > 0 ? Number(((totalCommission / totalViews) * 1000).toFixed(2)) : 0;

  return {
    totalViews,
    totalClicks,
    totalOrders,
    totalCommission,
    confirmedCommission,
    pendingCommission,
    cancelledCommission,
    conversionRatePercent,
    epc,
    revenuePer1000Views
  };
}
