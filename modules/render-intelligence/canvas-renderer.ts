import { createCanvas } from '@napi-rs/canvas';
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
  pngBuffer: Buffer;
  jpegBuffer: Buffer;
  mimeType: string;
}

export async function renderSlideToCanvas(
  slide: CarouselSlide,
  options?: CanvasRenderOptions,
): Promise<CanvasRenderResult> {
  const width = (options?.width || 1080) * (options?.scale || 1);
  const height = (options?.height || 1350) * (options?.scale || 1);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw slide background
  ctx.fillStyle = slide.background || '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Draw headline & assets
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 54px sans-serif';

  let y = 200;
  for (const asset of slide.assets) {
    if (asset.type === 'text' && asset.text) {
      ctx.fillText(asset.text.substring(0, 40), 80, y);
      y += 80;
    }
  }

  const pngBuffer = await canvas.encode('png');
  const jpegBuffer = await canvas.encode('jpeg');

  const textAssets = slide.assets.filter(a => a.type === 'text').map(a => a.text).join(' - ');
  const svgOutput = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${slide.background || '#FFFFFF'}"/>
    <text x="80" y="200" font-family="sans-serif" font-size="48" font-weight="bold" fill="#111111">${textAssets}</text>
  </svg>`;

  return {
    width,
    height,
    svgOutput,
    pngBuffer,
    jpegBuffer,
    mimeType: 'image/png',
  };
}
