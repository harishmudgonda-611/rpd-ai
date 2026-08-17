
import type { CommercePlatform } from '../extraction-intelligence/types.js';

export type DistributionSurface =
  | 'instagram'
  | 'youtube-shorts'
  | 'whatsapp';

export type PlatformRequirements = {
  platform: DistributionSurface;
  aspectRatio: '9:16' | '1:1' | '4:5';
  maxVideoSeconds: number;
  preferredHookLength: number;
  cta: string;
  requirements: string[];
};

export type PlatformIntelligence = {
  sourcePlatform: CommercePlatform;
  targets: PlatformRequirements[];
  recommendedPrimary: DistributionSurface;
  reasons: string[];
};
