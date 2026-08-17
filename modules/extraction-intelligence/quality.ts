import type { NormalizedProduct } from '../../src/types.js';
import type { ExtractionQuality } from './types.js';

export function evaluateExtractionQuality(
  product: NormalizedProduct,
): ExtractionQuality {
  const missingFields: string[] = [];
  const reasons: string[] = [];

  const title = product.title.value;
  const price = product.price.value;
  const images = product.images.length;
  const category = product.category.value;
  const description = product.description.value;

  if (!title) missingFields.push('title');
  if (price == null) missingFields.push('price');
  if (images === 0) missingFields.push('images');
  if (!category) missingFields.push('category');
  if (!description) missingFields.push('description');

  let score = 0;

  if (title) {
    score += 0.30;
    reasons.push('title-present');
  }

  if (price != null) {
    score += 0.25;
    reasons.push('price-present');
  }

  if (images > 0) {
    score += 0.20;
    reasons.push('images-present');
  }

  if (category) {
    score += 0.10;
    reasons.push('category-present');
  }

  if (description) {
    score += 0.10;
    reasons.push('description-present');
  }

  if (product.brand.value) {
    score += 0.05;
    reasons.push('brand-present');
  }

  const warnings = product.extraction.warnings.join(' ').toLowerCase();

  const blocked =
    /access denied|forbidden|captcha|blocked|upstream.*403|http 403|http 429/i.test(
      warnings,
    );

  if (blocked) {
    score *= 0.25;
    reasons.push('access-block-detected');
  }

  score = Number(
    Math.max(0, Math.min(1, score)).toFixed(4),
  );

  const trustworthy =
    !blocked &&
    Boolean(title) &&
    (
      price != null ||
      images > 0
    ) &&
    score >= 0.55;

  if (trustworthy) {
    reasons.push('trustworthy-product-evidence');
  } else {
    reasons.push('insufficient-product-evidence');
  }

  return {
    score,
    trustworthy,
    blocked,
    missingFields,
    reasons,
  };
}
