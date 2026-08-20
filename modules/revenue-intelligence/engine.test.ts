import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRevenueMetrics } from './engine.js';

test('calculateRevenueMetrics computes EPC and conversion rate correctly', () => {
  const perfs = [{ contentId: 'c1', platform: 'instagram', publishedAt: '', views: 1000, likes: 10, comments: 1, shares: 1, saves: 1, followersGained: 1 }];
  const clicks = [
    { clickId: 'k1', contentId: 'c1', productId: 'p1', affiliateNetwork: 'myntra', affiliateLink: '', trackingId: 't1', platform: 'instagram', timestamp: '' },
    { clickId: 'k2', contentId: 'c1', productId: 'p1', affiliateNetwork: 'myntra', affiliateLink: '', trackingId: 't1', platform: 'instagram', timestamp: '' }
  ];
  const orders = [
    { orderId: 'o1', contentId: 'c1', productId: 'p1', affiliateNetwork: 'myntra', orderTimestamp: '', orderStatus: 'confirmed', orderValue: 298, commission: 30, commissionStatus: 'confirmed', currency: 'INR' }
  ];

  const res = calculateRevenueMetrics(perfs, clicks, orders);
  assert.equal(res.totalViews, 1000);
  assert.equal(res.totalClicks, 2);
  assert.equal(res.totalOrders, 1);
  assert.equal(res.confirmedCommission, 30);
  assert.equal(res.conversionRatePercent, 50);
  assert.equal(res.epc, 15);
  assert.equal(res.revenuePer1000Views, 30);
});
