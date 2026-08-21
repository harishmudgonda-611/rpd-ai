export interface FidelityValidationResult {
  isFidelityValid: boolean;
  score: number;
  warnings: string[];
  recompositionNeeded: boolean;
}

export type AssetTypeCategory =
  | 'SOURCE_PRODUCT_ASSET'
  | 'GENERATED_MODEL_ASSET'
  | 'COMPOSITED_PRODUCT_MODEL_ASSET'
  | 'BACKGROUND_ASSET'
  | 'FINAL_RENDER_ASSET';

export interface ProductAssetTrace {
  product_id: string;
  asset_id: string;
  generation_id?: string;
  creative_id?: string;
  slide_id?: string;
  assetType: AssetTypeCategory;
  url: string;
}

export function resolveProductAssetWithFidelityFallback(
  sourceAsset: ProductAssetTrace,
  generatedAsset?: ProductAssetTrace | null,
  fidelityScore = 1.0,
): ProductAssetTrace {
  if (!generatedAsset) {
    return sourceAsset;
  }

  // Reject generated model image if fidelity score is below 0.8
  if (fidelityScore < 0.8) {
    return {
      ...sourceAsset,
      assetType: 'SOURCE_PRODUCT_ASSET',
    };
  }

  return generatedAsset;
}

export function validateProductFidelity(
  extractedProduct: { title?: { value?: string | null }; price?: { value?: number | null } },
  renderedSlideAssets: Array<{ type: string; text?: string }>,
): FidelityValidationResult {
  const warnings: string[] = [];
  let score = 1.0;

  if (extractedProduct.price?.value != null) {
    const priceStr = String(extractedProduct.price.value);
    const hasPriceInRender = renderedSlideAssets.some(a => a.text?.includes(priceStr));
    if (!hasPriceInRender) {
      score -= 0.3;
      warnings.push(`Extracted price (${priceStr}) not found in rendered slide text.`);
    }
  }

  const isFidelityValid = score >= 0.7;
  return {
    isFidelityValid,
    score,
    warnings,
    recompositionNeeded: !isFidelityValid,
  };
}
