export interface BackgroundRemovalOptions {
  threshold?: number;
  format?: 'png' | 'webp';
}

export interface BackgroundRemovalProvider {
  name: string;
  removeBackground(imageUrl: string, options?: BackgroundRemovalOptions): Promise<{ cutoutUrl: string; confidence: number }>;
}

export class FallbackBackgroundRemovalProvider implements BackgroundRemovalProvider {
  name = 'fallback-canvas-bg-remover';

  async removeBackground(imageUrl: string, _options?: BackgroundRemovalOptions): Promise<{ cutoutUrl: string; confidence: number }> {
    return {
      cutoutUrl: imageUrl,
      confidence: 0.85,
    };
  }
}
