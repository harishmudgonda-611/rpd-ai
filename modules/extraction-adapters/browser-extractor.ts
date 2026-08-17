import { extractProduct } from '../../src/extractor.js';
import {
  createUnavailableBrowserProvider,
  type BrowserProvider,
} from './browser-provider.js';
import type { ExtractionAttempt } from './types.js';

export async function extractWithBrowser(
  url: string,
  provider: BrowserProvider = createUnavailableBrowserProvider(),
): Promise<ExtractionAttempt> {
  try {
    const available = await provider.available();

    if (!available) {
      return {
        method: 'browser',
        success: false,
        blocked: false,
        product: null,
        error: `Browser provider "${provider.name}" is unavailable.`,
      };
    }

    const page = await provider.fetch({
      url,
      waitUntil: 'domcontentloaded',
      timeoutMs: 30000,
    });

    const product = extractProduct(
      page.html,
      page.finalUrl || url,
    );

    const trustworthy =
      Boolean(product.title.value) &&
      (
        Boolean(product.price.value) ||
        product.images.length > 0
      );

    return {
      method: 'browser',
      success: trustworthy,
      blocked: false,
      product,
      error: trustworthy
        ? null
        : 'Browser page loaded but trustworthy product data was not found.',
    };
  } catch (error) {
    return {
      method: 'browser',
      success: false,
      blocked: false,
      product: null,
      error:
        error instanceof Error
          ? error.message
          : 'Browser extraction failed.',
    };
  }
}
