import type {
  ExtractionAdapter,
  ExtractionAttempt,
} from './types.js';

/**
 * Browser extraction contract.
 *
 * The actual browser engine is intentionally injected later.
 * This keeps RPD independent of Playwright/Puppeteer/browser
 * implementation details.
 */
export const browserExtractionAdapter: ExtractionAdapter = {
  name: 'browser-rendered-extractor',
  method: 'browser',

  canHandle(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  async extract(_url: string): Promise<ExtractionAttempt> {
    return {
      method: 'browser',
      success: false,
      blocked: false,
      product: null,
      error: 'Browser extraction engine is not configured.',
    };
  },
};
