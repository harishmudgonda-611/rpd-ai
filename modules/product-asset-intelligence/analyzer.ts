import type {
  ProductAsset,
  ProductAssetAnalysis,
} from './types.js';

const junkPatterns = [
  'akamai',
  'logo',
  'favicon',
  'icon',
  'sprite',
  'placeholder',
  'avatar',
  'tracking',
  'pixel',
];

function scoreAsset(url: string): {
  score: number;
  reasons: string[];
  rejected: boolean;
} {
  const normalized = url.toLowerCase();

  const reasons: string[] = [];
  let score = 0.5;

  for (const pattern of junkPatterns) {
    if (normalized.includes(pattern)) {
      score -= 0.25;
      reasons.push(`junk-pattern:${pattern}`);
    }
  }

  if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(normalized)) {
    score += 0.2;
    reasons.push('image-extension');
  }

  if (/product|catalog|pdp|item|fashion|dress|kurti|shirt|saree/i.test(normalized)) {
    score += 0.15;
    reasons.push('product-path-signal');
  }

  if (score < 0.5) {
    reasons.push('below-product-confidence-threshold');
  }

  return {
    score: Number(Math.max(0, Math.min(1, score)).toFixed(4)),
    reasons,
    rejected: score < 0.5,
  };
}

export function analyzeProductAssets(
  images: Array<{ url: string; source?: string }>,
): ProductAssetAnalysis {
  const assets: ProductAsset[] = images.map((image) => {
    const result = scoreAsset(image.url);

    return {
      url: image.url,
      type: result.rejected ? 'unknown' : 'product',
      width: null,
      height: null,
      score: result.score,
      reasons: [
        ...(image.source ? [`source:${image.source}`] : []),
        ...result.reasons,
      ],
    };
  });

  const productImages = assets
    .filter((asset) => asset.type === 'product')
    .sort((a, b) => b.score - a.score);

  const rejectedImages = assets
    .filter((asset) => asset.type !== 'product')
    .sort((a, b) => b.score - a.score);

  const primaryImage = productImages[0] ?? null;

  const warnings: string[] = [];

  if (!primaryImage) {
    warnings.push('No trustworthy product image found');
  }

  if (rejectedImages.length > 0) {
    warnings.push(
      `${rejectedImages.length} image(s) rejected as non-product assets`,
    );
  }

  const confidence = primaryImage
    ? Number(primaryImage.score.toFixed(4))
    : 0;

  return {
    primaryImage,
    productImages,
    rejectedImages,
    confidence,
    warnings: [...new Set(warnings)],
    reasons: [
      `input-images:${images.length}`,
      `accepted-images:${productImages.length}`,
      `rejected-images:${rejectedImages.length}`,
      primaryImage
        ? 'primary-product-image-selected'
        : 'no-primary-product-image',
    ],
  };
}
