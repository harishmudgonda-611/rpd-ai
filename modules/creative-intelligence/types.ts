import type { NormalizedProduct } from '../../src/types.js';
import type { ContentAngle, CTAType } from '../content-intelligence/types.js';
import type { CarouselTemplateId } from '../carousel-generator/types.js';

export type CreativeObjective =
  | 'conversion'
  | 'engagement'
  | 'discovery'
  | 'save-share';

export type CreativeSignal = {
  name: string;
  value: boolean | number;
  weight: number;
  reason: string;
};

export type CreativeDecision = {
  angle: ContentAngle;
  objective: CreativeObjective;
  cta: CTAType;
  template: CarouselTemplateId;
  score: number;
  confidence: number;
  creativeScore: number;
  emotionalTrigger: string;
  audienceAngle: string;
  presentationStrategy: string;
  urgencyStrategy: string;
  reasons: string[];
  signals: CreativeSignal[];
};

export type CreativeDecisionRequest = {
  product: NormalizedProduct;
  objective?: CreativeObjective;
  preferredAngle?: ContentAngle;
  preferredCTA?: CTAType;
  preferredTemplate?: CarouselTemplateId;
};
