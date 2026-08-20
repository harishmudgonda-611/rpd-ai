import type { CarouselSlide, CarouselInput } from '../types.js';

export function createHighFashionSplitSlide(index: number, input: CarouselInput): CarouselSlide {
  const slideContent = input.content.slides[index] || { role: 'hero', headline: input.productTitle };
  return {
    index: index + 1,
    role: slideContent.role,
    background: '#F4EFEA',
    assets: [
      { type: 'text', text: slideContent.headline },
      { type: 'text', text: slideContent.body || '' },
      ...(input.modelImage ? [{ type: 'image' as const, src: input.modelImage, alt: input.productTitle }] : []),
      ...(input.price ? [{ type: 'text' as const, text: `Price: ${input.price}` }] : []),
    ],
  };
}
