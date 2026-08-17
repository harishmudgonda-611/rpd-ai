import type {
  ProductAsset,
  ProductAssetAnalysis,
  ProductAssetRole,
  ProductAssetType,
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
  'loader',
  'spinner',
];

const productPatterns = [
  'product',
  'products',
  'catalog',
  'pdp',
  'item',
  'fashion',
  'dress',
  'kurti',
  'shirt',
  'saree',
  'lehenga',
  'jeans',
  'top',
  'women',
  'men',
];

const detailPatterns = [
  'detail',
  'zoom',
  'back',
  'side',
  'closeup',
  'close-up',
];

function extension(url: string): string | null {
  const match = url.match(/\.(jpg|jpeg|png|webp|avif)(?:\?|$)/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function classifyType(
  url: string,
  rejected: boolean,
): ProductAssetType {
  if (rejected) {
    const normalized = url.toLowerCase();

    if (normalized.includes('logo')) return 'logo';
    if (
      normalized.includes('icon') ||
      normalized.includes('favicon') ||
      normalized.includes('sprite')
    ) {
      return 'icon';
    }

    if (
      normalized.includes('placeholder') ||
      normalized.includes('loader')
    ) {
      return 'placeholder';
    }

    return 'unknown';
  }

  return 'product';
}

function classifyRole(
  url: string,
  score: number,
  type: ProductAssetType,
): ProductAssetRole {
  if (type !== 'product') return 'unknown';

  const normalized = url.toLowerCase();

  if (detailPatterns.some((pattern) => normalized.includes(pattern))) {
    return 'detail';
  }

  return score >= 0.8 ? 'primary-product' : 'alternate-product';
}

function scoreAsset(url: string): {
  score: number;
  reasons: string[];
  rejected: boolean;
} {
  const normalized = url.toLowerCase();

  let score = 0.5;
  const reasons: string[] = [];

  for (const pattern of junkPatterns) {
    if (normalized.includes(pattern)) {
      score -= 0.3;
      reasons.push(`junk-pattern:${pattern}`);
    }
  }

  const ext = extension(normalized);

  if (ext) {
    score += 0.2;
    reasons.push(`image-extension:${ext}`);
  } else {
    score -= 0.1;
    reasons.push('missing-recognized-image-extension');
  }

  if (productPatterns.some((pattern) => normalized.includes(pattern))) {
    score += 0.15;
    reasons.push('product-path-signal');
  }

  if (/cdn|cloudfront|cloudinary|images|media/i.test(normalized)) {
    score += 0.05;
    reasons.push('image-host-signal');
  }

  score = Math.max(0, Math.min(1, score));

  if (score < 0.5) {
    reasons.push('below-product-confidence-threshold');
  }

  return {
    score: Number(score.toFixed(4)),
    reasons,
    rejected: score < 0.5,
  };
}

function normalizedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';

    for (const key of [
      'width',
      'height',
      'w',
      'h',
      'quality',
      'q',
      'format',
    ]) {
      parsed.searchParams.delete(key);
    }

    return parsed.toString().toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function analyzeProductAssets(
  images: Array<{ url: string; source?: string }>,
): ProductAssetAnalysis {
  const seen = new Map<string, ProductAsset>();

  const duplicateImages: ProductAsset[] = [];
  const assets: ProductAsset[] = [];

  for (const image of images) {
    const result = scoreAsset(image.url);
    const type = classifyType(image.url, result.rejected);
    const role = classifyRole(image.url, result.score, type);
    const key = normalizedUrl(image.url);

    const asset: ProductAsset = {
      url: image.url,
      type,
      role,
      width: null,
      height: null,
      score: result.score,
      reasons: [
        ...(image.source ? [`source:${image.source}`] : []),
        ...result.reasons,
      ],
      duplicateOf: null,
    };

    const existing = seen.get(key);

    if (existing) {
      asset.duplicateOf = existing.url;
      asset.reasons.push('duplicate-url-equivalent');
      duplicateImages.push(asset);
      continue;
    }

    seen.set(key, asset);
    assets.push(asset);
  }

  const productImages = assets
    .filter((asset) => asset.type === 'product')
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      if (a.role === 'primary-product') return -1;
      if (b.role === 'primary-product') return 1;

      return a.url.localeCompare(b.url);
    });

  const rejectedImages = assets
    .filter((asset) => asset.type !== 'product')
    .sort((a, b) => b.score - a.score);

  const primaryImage = productImages[0] ?? null;

  if (primaryImage) {
    primaryImage.role = 'primary-product';

    for (const image of productImages.slice(1)) {
      if (image.role === 'primary-product') {
        image.role = 'alternate-product';
      }
    }
  }

  const warnings: string[] = [];

  if (!primaryImage) {
    warnings.push('No trustworthy product image found');
  }

  if (rejectedImages.length > 0) {
    warnings.push(
      `${rejectedImages.length} image(s) rejected as non-product assets`,
    );
  }

  if (duplicateImages.length > 0) {
    warnings.push(
      `${duplicateImages.length} duplicate image(s) removed from usable assets`,
    );
  }

  const confidence = primaryImage
    ? Number(primaryImage.score.toFixed(4))
    : 0;

  return {
    primaryImage,
    productImages,
    rejectedImages,
    duplicateImages,
    confidence,
    warnings: [...new Set(warnings)],
    reasons: [
      `input-images:${images.length}`,
      `accepted-images:${productImages.length}`,
      `rejected-images:${rejectedImages.length}`,
      `duplicate-images:${duplicateImages.length}`,
      primaryImage
        ? 'primary-product-image-selected'
        : 'no-primary-product-image',
    ],
  };
}
