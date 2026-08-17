
import type {
  DistributionSurface,
  PlatformIntelligence,
  PlatformRequirements,
} from './types.js';
import type { CommercePlatform } from '../extraction-intelligence/types.js';

const REQUIREMENTS: Record<DistributionSurface, PlatformRequirements> = {
  instagram: {
    platform: 'instagram',
    aspectRatio: '9:16',
    maxVideoSeconds: 90,
    preferredHookLength: 8,
    cta: 'Shop now',
    requirements: [
      'strong visual hook',
      'mobile-first typography',
      'clear product presentation',
      'short CTA',
    ],
  },
  'youtube-shorts': {
    platform: 'youtube-shorts',
    aspectRatio: '9:16',
    maxVideoSeconds: 60,
    preferredHookLength: 8,
    cta: 'Check the product',
    requirements: [
      'fast opening',
      'retention-oriented pacing',
      'clear product identity',
      'canonical product URL preserved',
    ],
  },
  whatsapp: {
    platform: 'whatsapp',
    aspectRatio: '9:16',
    maxVideoSeconds: 60,
    preferredHookLength: 10,
    cta: 'Join WhatsApp for daily deals',
    requirements: [
      'direct-response copy',
      'deal clarity when verified',
      'simple CTA',
      'share-friendly presentation',
    ],
  },
};

export function analyzePlatformIntelligence(
  sourcePlatform: CommercePlatform,
  targets: DistributionSurface[] = [
    'instagram',
    'youtube-shorts',
    'whatsapp',
  ],
): PlatformIntelligence {
  const normalized = targets.filter(
    (target, index) => targets.indexOf(target) === index,
  );

  const selected: DistributionSurface[] = normalized.length
    ? normalized
    : ['instagram'];

  return {
    sourcePlatform,
    targets: selected.map((platform) => REQUIREMENTS[platform]),
    recommendedPrimary:
      selected.includes('instagram')
        ? 'instagram'
        : selected[0],
    reasons: [
      'platform-specific-production-rules-applied',
      'mobile-first-format-selected',
      sourcePlatform !== 'unknown'
        ? 'commerce-platform-detected'
        : 'commerce-platform-unknown',
    ],
  };
}
