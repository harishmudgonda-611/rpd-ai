import { fetchAndExtractProduct } from '../../src/extractor.js';
import type {
  ExtractionAdapter,
  ExtractionAttempt,
} from './types.js';

function isBlockedProduct(product: Awaited<ReturnType<typeof fetchAndExtractProduct>>): boolean {
  const warnings = product.extraction.warnings.join(' ').toLowerCase();

  return (
    product.extraction.confidence <= 0.2 &&
    (
      warnings.includes('title not found') ||
      warnings.includes('price not found')
    )
  );
}

export const httpExtractionAdapter: ExtractionAdapter = {
  name: 'http-product-extractor',
  method: 'http',

  canHandle(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  async extract(url: string): Promise<ExtractionAttempt> {
    try {
      const product = await fetchAndExtractProduct(url);

      return {
        method: 'http',
        success: !isBlockedProduct(product),
        blocked: isBlockedProduct(product),
        product,
        error: null,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'HTTP extraction failed';

      const blocked =
        /\b(401|403|429)\b/.test(message) ||
        /access denied|blocked|captcha|forbidden/i.test(message);

      return {
        method: 'http',
        success: false,
        blocked,
        product: null,
        error: message,
      };
    }
  },
};
