import type { NormalizedProduct } from '../../src/types.js';
import type { ContentPackage, ContentRequest } from '../content-intelligence/types.js';
import type { VariantAnalysis } from '../variant-colour-intelligence/types.js';
import type { AssetSelectionRequest, AssetSelectionResult, ModelAsset } from '../ai-fashion-model/types.js';
import type { CarouselDocument, CarouselTemplateId } from '../carousel-generator/types.js';

export type RPDGenerationRequest = {
  product: NormalizedProduct;
  content?: Omit<ContentRequest, 'product'>;
  modelSelection?: AssetSelectionRequest;
  template?: CarouselTemplateId;
  modelAssets?: ModelAsset[];
};

export type RPDGenerationResult = {
  product: NormalizedProduct;
  variants: VariantAnalysis;
  selectedModel: AssetSelectionResult;
  content: ContentPackage;
  carousel: CarouselDocument;
  warnings: string[];
};
