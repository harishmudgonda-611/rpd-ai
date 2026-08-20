import type { CarouselSlide } from '../carousel-generator/types.js';

export interface CanvasRenderOptions {
  width?: number;
  height?: number;
  scale?: number;
}

export interface CanvasRenderResult {
  width: number;
  height: number;
  svgOutput: string;
  mimeType: string;
}

export async function renderSlideToCanvas(
  slide: CarouselSlide,
  options?: CanvasRenderOptions,
): Promise<CanvasRenderResult> {
  const width = (options?.width || 1080) * (options?.scale || 1);
  const height = (options?.height || 1350) * (options?.scale || 1);

  const textAssets = slide.assets.filter(a => a.type === 'text').map(a => a.text).join(' - ');
  const svgOutput = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${slide.background || '#FFFFFF'}"/>
    <text x="80" y="200" font-family="sans-serif" font-size="48" font-weight="bold" fill="#111111">${textAssets}</text>
  </svg>`;

  return {
    width,
    height,
    svgOutput,
    mimeType: 'image/svg+xml',
  };
}
