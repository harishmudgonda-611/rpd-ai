import type { NormalizedProduct } from '../../src/types.js';
import type { ModelAsset } from '../ai-fashion-model/types.js';
import type { RPDGenerationResult } from '../rpd-orchestrator/types.js';
import type { CreativeExecutionPlan } from '../creative-orchestrator/types.js';
import type { ProductAssetAnalysis } from '../product-asset-intelligence/types.js';
import type { ExtractionResult } from '../extraction-adapters/types.js';
import type { IntelligentExtractionResult } from '../extraction-intelligence/types.js';
import type { DistributionPlatform, DistributionResult } from '../distribution-intelligence/types.js';

export type RPDGenerateRequest = {
  url: string;
  platforms?: DistributionPlatform[];
  modelAssets?: ModelAsset[];
};

export type RPDGenerateResult = {
  product: NormalizedProduct;
  extraction: ExtractionResult;
  extractionIntelligence: IntelligentExtractionResult;
  assets: ProductAssetAnalysis;
  creative: CreativeExecutionPlan;
  generation: RPDGenerationResult;
  distribution: DistributionResult[];
  warnings: string[];
};
