import { extractWithAdapters } from '../extraction-adapters/router.js';
import { planCreative } from '../creative-orchestrator/orchestrator.js';
import { generateRPD } from '../rpd-orchestrator/orchestrator.js';
import { optimizeDistribution } from '../distribution-intelligence/optimizer.js';
import { analyzeProductAssets } from '../product-asset-intelligence/analyzer.js';
import { analyzeExtraction } from '../extraction-intelligence/analyzer.js';
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

  const extraction = await extractWithAdapters(request.url.trim());
  const product = extraction.product;
  const extractionIntelligence = analyzeExtraction(product);

  const assets = analyzeProductAssets(product.images);

  // Only pass trusted product assets downstream. The original extracted
  // product remains untouched for provenance/auditability.
  const generationProduct = {
    ...product,
    images: assets.productImages.map((asset) => ({
      url: asset.url,
      source: 'product-asset-intelligence',
    })),
  };

  const creative = planCreative({
    product: generationProduct,
    modelAssets: request.modelAssets,
  });

  const generation = generateRPD({
    product: generationProduct,
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
    ...extraction.warnings,
    ...extractionIntelligence.quality.reasons,
    ...assets.warnings,
    ...creative.warnings,
    ...generation.warnings,
    ...distribution.flatMap((item) => item.warnings),
  ];

  return {
    product,
    extraction,
    extractionIntelligence,
    assets,
    creative,
    generation,
    distribution,
    warnings: [...new Set(warnings)],
  };
}
