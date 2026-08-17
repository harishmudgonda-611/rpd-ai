import type { NormalizedProduct } from '../../src/types.js';
import type { AssetSelectionRequest, AssetSelectionResult, ModelAsset } from '../ai-fashion-model/types.js';
import type { CarouselTemplateId } from '../carousel-generator/types.js';
import type { ContentAngle, CTAType, ContentPackage } from '../content-intelligence/types.js';

export type CreativeIntent = {
  angle: ContentAngle;
  cta: CTAType;
  template: CarouselTemplateId;
  audience: string;
  objective: 'conversion' | 'engagement' | 'discovery' | 'save-share';
};

export type CreativeConcept = {
  name: string;
  hook: string;
  rationale: string;
  intent: CreativeIntent;
  assetRequest: AssetSelectionRequest;
};

export type CreativeExecutionPlan = {
  concept: CreativeConcept;
  selectedModel: AssetSelectionResult;
  content: ContentPackage | null;
  steps: string[];
  warnings: string[];
};

export type CreativeOrchestratorRequest = {
  product: NormalizedProduct;
  modelAssets?: ModelAsset[];
  audience?: string;
  objective?: CreativeIntent['objective'];
  angle?: ContentAngle;
  cta?: CTAType;
  template?: CarouselTemplateId;
};
