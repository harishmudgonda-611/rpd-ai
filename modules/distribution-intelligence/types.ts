import type { ContentPackage } from '../content-intelligence/types.js';
import type { CreativeExecutionPlan } from '../creative-orchestrator/types.js';

export type DistributionPlatform =
  | 'instagram'
  | 'youtube-shorts'
  | 'whatsapp';

export type DistributionRequest = {
  platform: DistributionPlatform;
  creative: CreativeExecutionPlan;
  content?: ContentPackage | null;
  productUrl: string;
};

export type DistributionMetadata = {
  platform: DistributionPlatform;
  title: string;
  caption: string;
  hashtags: string[];
  cta: string;
  aspectRatio: '9:16';
  width: 1080;
  height: 1920;
  publishingNotes: string[];
};

export type DistributionResult = {
  platform: DistributionPlatform;
  metadata: DistributionMetadata;
  warnings: string[];
  reasons: string[];
};
