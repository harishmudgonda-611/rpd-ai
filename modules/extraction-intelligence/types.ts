import type { NormalizedProduct } from '../../src/types.js';

export type CommercePlatform =
  | 'meesho'
  | 'amazon'
  | 'flipkart'
  | 'myntra'
  | 'ajio'
  | 'nykaa'
  | 'unknown';

export type ExtractionQuality = {
  score: number;
  trustworthy: boolean;
  blocked: boolean;
  missingFields: string[];
  reasons: string[];
};

export type PlatformProfile = {
  platform: CommercePlatform;
  hosts: string[];
  requiresBrowserFallback: boolean;
};

export type IntelligentExtractionResult = {
  product: NormalizedProduct;
  platform: CommercePlatform;
  quality: ExtractionQuality;
};
