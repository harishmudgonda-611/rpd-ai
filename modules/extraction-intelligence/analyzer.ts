import type { NormalizedProduct } from '../../src/types.js';
import { detectPlatform } from './platforms.js';
import { evaluateExtractionQuality } from './quality.js';
import type { IntelligentExtractionResult } from './types.js';

export function analyzeExtraction(
  product: NormalizedProduct,
): IntelligentExtractionResult {
  return {
    product,
    platform: detectPlatform(product.sourceUrl),
    quality: evaluateExtractionQuality(product),
  };
}
