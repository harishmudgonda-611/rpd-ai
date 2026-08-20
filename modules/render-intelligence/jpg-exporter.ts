import type { CarouselSlide } from '../carousel-generator/types.js';
import { renderSlideToCanvas } from './canvas-renderer.js';

export async function exportSlideToJpg(slide: CarouselSlide): Promise<{ buffer: Buffer; mimeType: 'image/jpeg' }> {
  const canvasRes = await renderSlideToCanvas(slide);
  return {
    buffer: canvasRes.jpegBuffer,
    mimeType: 'image/jpeg',
  };
}
