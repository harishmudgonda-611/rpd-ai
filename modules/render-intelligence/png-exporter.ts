import type { CarouselSlide } from '../carousel-generator/types.js';
import { renderSlideToCanvas } from './canvas-renderer.js';

export async function exportSlideToPng(slide: CarouselSlide): Promise<{ buffer: Buffer; mimeType: 'image/png' }> {
  const canvasRes = await renderSlideToCanvas(slide);
  return {
    buffer: canvasRes.pngBuffer,
    mimeType: 'image/png',
  };
}
