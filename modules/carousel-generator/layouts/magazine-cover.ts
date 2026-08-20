import type { CarouselSlide, CarouselInput } from '../types.js';

export function createMagazineCoverSlide(index: number, input: CarouselInput): CarouselSlide {
  const slideContent = input.content.slides[index] || { role: 'hook', headline: input.productTitle };
  return {
    index: index + 1,
    role: slideContent.role,
    background: '#1A1A1A',
    assets: [
      { type: 'text', text: slideContent.headline.toUpperCase() },
      { type: 'text', text: slideContent.body || 'SEASONAL CURATION' },
      ...(input.modelImage ? [{ type: 'image' as const, src: input.modelImage, alt: input.productTitle }] : []),
    ],
  };
}
