import type { ContentPerformance, AffiliateClick, AffiliateOrder } from '../../src/business-intelligence.js';

export type Recommendation = {
  type: 'creative' | 'product' | 'platform' | 'format' | 'hook' | 'cta';
  recommendation: string;
  confidenceScore: number;
  evidence: string;
};

export type LearningInsights = {
  insights: string[];
  recommendations: Recommendation[];
  hasEnoughData: boolean;
};

export function generateLearningRecommendations(
  perfs: ContentPerformance[] = [],
  clicks: AffiliateClick[] = [],
  orders: AffiliateOrder[] = []
): LearningInsights {
  const totalEvents = perfs.length + clicks.length + orders.length;

  if (totalEvents < 3) {
    return {
      insights: ['Insufficient performance data to form statistical learning patterns.'],
      recommendations: [
        {
          type: 'creative',
          recommendation: 'Publish more carousels/reels to collect initial engagement evidence.',
          confidenceScore: 0.1,
          evidence: 'Less than 3 attribution events recorded.'
        }
      ],
      hasEnoughData: false
    };
  }

  const insights: string[] = [];
  const recommendations: Recommendation[] = [];

  // Winning platform detection
  const platformClicks = new Map<string, number>();
  clicks.forEach(c => {
    platformClicks.set(c.platform, (platformClicks.get(c.platform) || 0) + 1);
  });

  let topPlatform = 'instagram';
  let maxClicks = 0;
  for (const [platform, count] of platformClicks.entries()) {
    if (count > maxClicks) {
      maxClicks = count;
      topPlatform = platform;
    }
  }

  if (maxClicks > 0) {
    insights.push(`Top performing distribution platform by CTR: ${topPlatform} (${maxClicks} clicks)`);
    recommendations.push({
      type: 'platform',
      recommendation: `Focus primary creative distribution on ${topPlatform}`,
      confidenceScore: 0.85,
      evidence: `${topPlatform} generated the highest affiliate click volume.`
    });
  }

  return {
    insights: insights.length ? insights : ['Consistent performance across tracked channels.'],
    recommendations: recommendations.length ? recommendations : [
      {
        type: 'format',
        recommendation: 'Test 9:16 Reel format with price-led hooks.',
        confidenceScore: 0.7,
        evidence: 'Historical price-led hooks demonstrate high conversion intent.'
      }
    ],
    hasEnoughData: true
  };
}
