import type {
  DistributionMetadata,
  DistributionPlatform,
  DistributionRequest,
  DistributionResult,
} from './types.js';

function value<T>(field: { value: T | null }): T | null {
  return field.value;
}

function platformCTA(
  platform: DistributionPlatform,
  cta: string,
): string {
  if (platform === 'whatsapp') {
    return 'Join WhatsApp for daily deals';
  }

  if (cta === 'shop-now') {
    return 'Shop now';
  }

  if (cta === 'comment') {
    return 'Comment your choice';
  }

  if (cta === 'save-post') {
    return 'Save this deal';
  }

  return 'Discover this look';
}

function hashtags(request: DistributionRequest): string[] {
  const category =
    value(request.product.category)?.toLowerCase().trim();

  const tags = [
    'RPD',
    'FashionDeals',
    'FashionFinds',
  ];

  if (category) {
    tags.push(category.replace(/\s+/g, ''));
  }

  if (request.creative.concept.intent.angle === 'price') {
    tags.push('Deals', 'BestPrice');
  }

  if (request.creative.concept.intent.angle === 'trend') {
    tags.push('TrendingFashion');
  }

  return [...new Set(tags)].slice(0, 8);
}

function title(request: DistributionRequest): string {
  const product =
    value(request.product.title) ?? 'Fashion Find';

  if (request.platform === 'youtube-shorts') {
    return `${product} | Fashion Deal`;
  }

  return product;
}

function caption(request: DistributionRequest): string {
  const product =
    value(request.product.title) ?? 'this fashion find';

  const category =
    value(request.product.category) ?? 'fashion';

  const hook = request.creative.concept.hook;

  return [
    hook,
    '',
    `${product} — a ${category} pick worth checking out.`,
    '',
    platformCTA(
      request.platform,
      request.creative.concept.intent.cta,
    ),
    request.productUrl,
  ].join('\n');
}

export function optimizeDistribution(
  request: DistributionRequest,
): DistributionResult {
  const metadata: DistributionMetadata = {
    platform: request.platform,
    title: title(request),
    caption: caption(request),
    hashtags: hashtags(request),
    cta: platformCTA(
      request.platform,
      request.creative.concept.intent.cta,
    ),
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    publishingNotes: [
      'Use the generated creative without altering verified product claims.',
      'Keep the product URL as the canonical destination.',
      `Optimize publishing copy for ${request.platform}.`,
    ],
  };

  const warnings = [
    ...request.creative.warnings,
  ];

  const reasons = [
    `platform:${request.platform}`,
    `angle:${request.creative.concept.intent.angle}`,
    `objective:${request.creative.concept.intent.objective}`,
    'vertical-format:9:16',
    'canonical-product-url-preserved',
  ];

  return {
    platform: request.platform,
    metadata,
    warnings: [...new Set(warnings)],
    reasons,
  };
}
