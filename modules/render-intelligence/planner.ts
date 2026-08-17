
import type { NormalizedProduct } from '../../src/types.js';
import type { CarouselTemplateId } from '../carousel-generator/types.js';
import type { RenderPlan } from './types.js';

export function createRenderPlan(input: {
  product: NormalizedProduct;
  template?: CarouselTemplateId;
  modelImage?: string | null;
}): RenderPlan {
  const title = input.product.title.value || 'Fashion find';
  const price = input.product.price.value;
  const discount = input.product.discountPercent.value;

  const scenes: RenderPlan['scenes'] = [
    {
      index: 1,
      role: 'hook',
      durationMs: 1800,
      headline: 'Wait till you see this fashion find',
    },
    {
      index: 2,
      role: 'product',
      durationMs: 2800,
      headline: title,
    },
    {
      index: 3,
      role: 'benefit',
      durationMs: 2600,
      headline: 'A fresh addition to your wardrobe',
    },
    {
      index: 4,
      role: 'proof',
      durationMs: 2400,
      headline: input.product.category.value
        ? input.product.category.value
        : 'Style it your way',
    },
    {
      index: 5,
      role: 'price',
      durationMs: 2200,
      headline:
        price != null
          ? 'Current price available'
          : 'Check the current price',
    },
    {
      index: 6,
      role: 'cta',
      durationMs: 2200,
      headline: 'Tap the link to shop',
    },
  ];

  const assets: RenderPlan['assets'] = input.product.images.map(
    (image) => ({
      url: image.url,
      role: 'product',
      source: image.source,
    }),
  );

  if (input.modelImage) {
    assets.push({
      url: input.modelImage,
      role: 'model',
      source: 'ai-fashion-model',
    });
  }

  const warnings: string[] = [];

  if (assets.length === 0) {
    warnings.push('Render plan has no visual product assets');
  }

  if (price == null) {
    warnings.push('Price unavailable; render must not fabricate price');
  }

  if (discount == null) {
    warnings.push(
      'Discount unavailable; render must not fabricate discount',
    );
  }

  return {
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    template: input.template || 'rpd-editorial',
    assets,
    scenes,
    exportTargets: ['mp4', 'webm', 'png-sequence'],
    warnings,
  };
}
