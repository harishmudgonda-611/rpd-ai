export type TemplateLayout =
  | 'hero-deal'
  | 'editorial'
  | 'split-product'
  | 'model-first'
  | 'minimal-price';

export type TemplateSelectionContext = {
  angle?: string | null;
  objective?: string | null;
  category?: string | null;
  hasPriceEvidence: boolean;
  hasProductImages: boolean;
  hasModelAsset: boolean;
  imageCount: number;
};

export type RPDTemplate = {
  id: string;
  name: string;
  layout: TemplateLayout;
  description: string;
  supportedAngles: string[];
  supportedObjectives: string[];
  minImages: number;
  supportsModel: boolean;
  supportsPrice: boolean;
  priority: number;
};

export type TemplateSelectionResult = {
  template: RPDTemplate;
  score: number;
  reasons: string[];
  warnings: string[];
};
