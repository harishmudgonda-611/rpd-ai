
import type { PlatformIntelligence } from '../platform-intelligence/types.js';
import type { RenderPlan } from '../render-intelligence/types.js';

export type ProductionManifest = {
  id: string;
  status: 'planned' | 'ready' | 'blocked';
  sourceUrl: string;
  canonicalUrl: string | null;
  platform: PlatformIntelligence;
  render: RenderPlan;
  artifacts: Array<{
    type: 'video' | 'carousel' | 'metadata';
    status: 'planned' | 'ready' | 'blocked';
    target: string;
  }>;
  warnings: string[];
};
