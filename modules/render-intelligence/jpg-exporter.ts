import type { CarouselSlide } from '../carousel-generator/types.js';
import { renderSlideToCanvas } from './canvas-renderer.js';

export async function exportSlideToJpg(slide: CarouselSlide): Promise<{ buffer: Buffer; mimeType: 'image/jpeg' }> {
  const canvasRes = await renderSlideToCanvas(slide);
  const buffer = Buffer.from(canvasRes.svgOutput, 'utf-8');
  return {
    buffer,
    mimeType: 'image/jpeg',
  };
}
