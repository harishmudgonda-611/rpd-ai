import type { NormalizedProduct } from '../../src/types.js';

export type BrowserExtractionRequest = {
  url: string;
  waitUntil?: 'domcontentloaded' | 'networkidle';
  timeoutMs?: number;
};

export type BrowserExtractionResponse = {
  html: string;
  finalUrl: string;
  title?: string | null;
};

export type BrowserProvider = {
  name: string;
  available(): Promise<boolean>;
  fetch(
    request: BrowserExtractionRequest,
  ): Promise<BrowserExtractionResponse>;
};

export function createUnavailableBrowserProvider(
  name = 'browser-provider',
): BrowserProvider {
  return {
    name,

    async available() {
      return false;
    },

    async fetch() {
      throw new Error(
        'No browser extraction provider is configured.',
      );
    },
  };
}
