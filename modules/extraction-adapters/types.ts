import type { NormalizedProduct } from '../../src/types.js';

export type ExtractionMethod =
  | 'http'
  | 'browser'
  | 'platform-adapter';

export type ExtractionAttempt = {
  method: ExtractionMethod;
  success: boolean;
  blocked: boolean;
  product: NormalizedProduct | null;
  error?: string | null;
};

export type ExtractionResult = {
  product: NormalizedProduct;
  method: ExtractionMethod;
  attempts: ExtractionAttempt[];
  warnings: string[];
};

export type ExtractionAdapter = {
  name: string;
  method: ExtractionMethod;
  canHandle(url: string): boolean;
  extract(url: string): Promise<ExtractionAttempt>;
};
