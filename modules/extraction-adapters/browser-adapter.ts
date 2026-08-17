import type {
  ExtractionAdapter,
  ExtractionAttempt,
} from './types.js';
import { extractWithBrowser } from './browser-extractor.js';

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

  async extract(url: string): Promise<ExtractionAttempt> {
    return extractWithBrowser(url);
  },
};
