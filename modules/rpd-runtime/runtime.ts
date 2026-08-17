import { fetchAndExtractProduct } from '../../src/extractor.js';
import { planCreative } from '../creative-orchestrator/orchestrator.js';
import { generateRPD } from '../rpd-orchestrator/orchestrator.js';
import { optimizeDistribution } from '../distribution-intelligence/optimizer.js';
import type {
  RPDGenerateRequest,
  RPDGenerateResult,
} from './types.js';
import type { DistributionPlatform } from '../distribution-intelligence/types.js';

const DEFAULT_PLATFORMS: DistributionPlatform[] = [
  'instagram',
  'youtube-shorts',
  'whatsapp',
];

export async function generateRPDFromUrl(
  request: RPDGenerateRequest,
): Promise<RPDGenerateResult> {
  if (!request.url?.trim()) {
    throw new Error('url is required');
  }

  const product = await fetchAndExtractProduct(request.url.trim());

  const creative = planCreative({
    product,
    modelAssets: request.modelAssets,
  });

  const generation = generateRPD({
    product,
    modelAssets: request.modelAssets,
    modelSelection: creative.concept.assetRequest,
    template: creative.concept.intent.template,
    content: {
      angle: creative.concept.intent.angle,
      cta: creative.concept.intent.cta,
      audience: creative.concept.intent.audience,
      slideCount: 6,
    },
  });

  const platforms = request.platforms?.length
    ? request.platforms
    : DEFAULT_PLATFORMS;

  const distribution = platforms.map((platform) =>
    optimizeDistribution({
      platform,
      creative,
      product,
      content: generation.content,
      productUrl: product.sourceUrl,
    }),
  );

  const warnings = [
    ...creative.warnings,
    ...generation.warnings,
    ...distribution.flatMap((item) => item.warnings),
  ];

  return {
    product,
    creative,
    generation,
    distribution,
    warnings: [...new Set(warnings)],
  };
}
