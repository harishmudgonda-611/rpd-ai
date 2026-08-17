
import type { NormalizedProduct } from '../../src/types.js';
import type { CommercePlatform } from '../extraction-intelligence/types.js';
import { analyzePlatformIntelligence } from '../platform-intelligence/analyzer.js';
import { createRenderPlan } from '../render-intelligence/planner.js';
import type { ProductionManifest } from './types.js';

export function createProductionManifest(input: {
  product: NormalizedProduct;
  platform: CommercePlatform;
  template?: any;
  modelImage?: string | null;
}): ProductionManifest {
  const platform = analyzePlatformIntelligence(input.platform);

  const render = createRenderPlan({
    product: input.product,
    template: input.template,
    modelImage: input.modelImage,
  });

  const warnings = [
    ...render.warnings,
  ];

  const blocked =
    !input.product.title.value ||
    render.assets.length === 0;

  return {
    id:
      'rpd-production-' +
      Date.now().toString(36),

    status: blocked
      ? 'blocked'
      : 'ready',

    sourceUrl: input.product.sourceUrl,
    canonicalUrl: input.product.canonicalUrl.value,

    platform,

    render,

    artifacts: [
      {
        type: 'video',
        status: blocked ? 'blocked' : 'planned',
        target: '9:16-short-video',
      },
      {
        type: 'carousel',
        status: blocked ? 'blocked' : 'planned',
        target: '1080x1350',
      },
      {
        type: 'metadata',
        status: 'planned',
        target: 'distribution',
      },
    ],

    warnings,
  };
}
