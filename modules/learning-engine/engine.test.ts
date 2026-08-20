import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLearningRecommendations } from './engine.js';

test('generateLearningRecommendations handles insufficient data gracefully', () => {
  const res = generateLearningRecommendations([], [], []);
  assert.equal(res.hasEnoughData, false);
  assert.ok(res.recommendations.length > 0);
  assert.equal(res.recommendations[0].confidenceScore, 0.1);
});

test('generateLearningRecommendations identifies top platforms with sufficient click data', () => {
  const perfs = [{ contentId: 'c1', platform: 'instagram', publishedAt: '', views: 500, likes: 5, comments: 0, shares: 0, saves: 0, followersGained: 0 }];
  const clicks = [
    { clickId: 'k1', contentId: 'c1', productId: 'p1', affiliateNetwork: 'myntra', affiliateLink: '', trackingId: 't1', platform: 'instagram', timestamp: '' },
    { clickId: 'k2', contentId: 'c1', productId: 'p1', affiliateNetwork: 'myntra', affiliateLink: '', trackingId: 't1', platform: 'instagram', timestamp: '' },
    { clickId: 'k3', contentId: 'c1', productId: 'p1', affiliateNetwork: 'myntra', affiliateLink: '', trackingId: 't1', platform: 'instagram', timestamp: '' }
  ];
  const orders = [
    { orderId: 'o1', contentId: 'c1', productId: 'p1', affiliateNetwork: 'myntra', orderTimestamp: '', orderStatus: 'confirmed', orderValue: 298, commission: 30, commissionStatus: 'confirmed', currency: 'INR' }
  ];

  const res = generateLearningRecommendations(perfs, clicks, orders);
  assert.equal(res.hasEnoughData, true);
  assert.ok(res.insights.length > 0);
  assert.equal(res.recommendations[0].type, 'platform');
});
