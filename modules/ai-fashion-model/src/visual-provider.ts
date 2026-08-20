export type VisualGenerationRequest = {
  prompt: string;
  category?: string | null;
  dominantColor?: string | null;
  style?: string | null;
};

export type VisualGenerationResult = {
  assetId: string;
  path: string;
  provider: string;
  confidence: number;
  isAiGenerated: boolean;
};

export interface CreativeVisualProvider {
  name: string;
  generateFashionVisual(req: VisualGenerationRequest): Promise<VisualGenerationResult | null>;
}

export class DefaultVisualProvider implements CreativeVisualProvider {
  name = 'real-product-asset-fallback';

  async generateFashionVisual(req: VisualGenerationRequest): Promise<VisualGenerationResult | null> {
    // When no AI model is connected, gracefully return null so pipeline uses real product assets
    return null;
  }
}

export const defaultVisualProvider = new DefaultVisualProvider();
