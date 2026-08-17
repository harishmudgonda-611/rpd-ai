import type {
  ExtractionAdapter,
  ExtractionAttempt,
  ExtractionResult,
} from './types.js';
import { httpExtractionAdapter } from './http-adapter.js';
import { browserExtractionAdapter } from './browser-adapter.js';

const adapters: ExtractionAdapter[] = [
  httpExtractionAdapter,
  browserExtractionAdapter,
];

export async function extractWithAdapters(
  url: string,
): Promise<ExtractionResult> {
  const attempts: ExtractionAttempt[] = [];
  const warnings: string[] = [];

  for (const adapter of adapters) {
    if (!adapter.canHandle(url)) {
      continue;
    }

    const attempt = await adapter.extract(url);
    attempts.push(attempt);

    if (attempt.success && attempt.product) {
      return {
        product: attempt.product,
        method: attempt.method,
        attempts,
        warnings: [
          ...warnings,
          ...attempt.product.extraction.warnings,
        ],
      };
    }

    if (attempt.blocked) {
      warnings.push(
        `${adapter.name}: upstream access blocked; trying next extraction adapter.`,
      );
    }

    if (attempt.error) {
      warnings.push(
        `${adapter.name}: ${attempt.error}`,
      );
    }
  }

  throw new Error(
    [
      'Product extraction failed.',
      ...warnings,
      'No configured extraction adapter produced trustworthy product data.',
    ].join(' '),
  );
}
