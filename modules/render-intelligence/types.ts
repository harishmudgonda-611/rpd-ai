
import type { CarouselTemplateId } from '../carousel-generator/types.js';

export type RenderAsset = {
  url: string;
  role: 'product' | 'model';
  source: string;
};

export type RenderPlan = {
  width: 1080;
  height: 1920;
  aspectRatio: '9:16';
  template: CarouselTemplateId;
  assets: RenderAsset[];
  scenes: Array<{
    index: number;
    role: 'hook' | 'product' | 'benefit' | 'proof' | 'price' | 'cta';
    durationMs: number;
    headline: string;
  }>;
  exportTargets: string[];
  warnings: string[];
};
