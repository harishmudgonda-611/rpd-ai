export interface CompositionRequest {
  productCutoutUrl: string;
  backdropTheme?: 'warm-studio' | 'minimal-grey' | 'editorial-beige' | 'soft-sage';
  width?: number;
  height?: number;
}

export interface CompositionResult {
  compositedImageUrl: string;
  width: number;
  height: number;
  theme: string;
}

export async function compositeProductOnBackdrop(request: CompositionRequest): Promise<CompositionResult> {
  const theme = request.backdropTheme || 'warm-studio';
  const width = request.width || 1080;
  const height = request.height || 1350;

  return {
    compositedImageUrl: request.productCutoutUrl,
    width,
    height,
    theme,
  };
}
