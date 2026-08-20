import type { CarouselSlide, CarouselInput } from '../types.js';

export function createMinimalCatalogSlide(index: number, input: CarouselInput): CarouselSlide {
  const slideContent = input.content.slides[index] || { role: 'details', headline: input.productTitle };
  return {
    index: index + 1,
    role: slideContent.role,
    background: '#FFFFFF',
    assets: [
      { type: 'text', text: slideContent.headline },
      { type: 'text', text: slideContent.body || '' },
      ...((input.productImages && input.productImages.length > 0)
        ? input.productImages.slice(0, 2).map(img => ({ type: 'image' as const, src: img, alt: input.productTitle }))
        : input.modelImage ? [{ type: 'image' as const, src: input.modelImage, alt: input.productTitle }] : []),
    ],
  };
}
