export interface FidelityValidationResult {
  isFidelityValid: boolean;
  score: number;
  warnings: string[];
  recompositionNeeded: boolean;
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
