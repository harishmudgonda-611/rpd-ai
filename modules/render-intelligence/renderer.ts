import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type RenderAsset = {
  url?: string | null;
  text?: string | null;
  type?: 'image' | 'text';
};

export type RenderSlide = {
  index: number;
  role: string;
  headline: string;
  body?: string | null;
  assets?: RenderAsset[];
};

export type RPDRenderInput = {
  productTitle?: string | null;
  price?: number | null;
  mrp?: number | null;
  discount?: number | null;
  productImages?: string[];
  modelImage?: string | null;
  slides?: RenderSlide[];
  template?: string | null;
  sourceUrl?: string | null;
};

export type RenderedAsset = {
  id: string;
  type: 'svg' | 'html';
  path: string;
  slide: number;
};

export type RPDRenderResult = {
  success: boolean;
  outputDir: string;
  assets: RenderedAsset[];
  slideCount: number;
  formats: string[];
  warnings: string[];
};

const esc = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

function background(template: string | null | undefined, index: number) {
  if (template === 'rpd-pink-deal') {
    return index % 2 ? '#FFF1F6' : '#FF4F87';
  }

  if (template === 'rpd-lookbook') return '#EFEFEA';
  if (template === 'rpd-colour-grid') return '#F4F5F7';
  if (template === 'rpd-minimal') return '#FFFFFF';

  return '#F7F3EE';
}

function foreground(template: string | null | undefined) {
  return template === 'rpd-pink-deal' ? '#111111' : '#222222';
}

function imageBlock(url: string, y: number) {
  return `
    <image
      href="${esc(url)}"
      x="100"
      y="${y}"
      width="880"
      height="620"
      preserveAspectRatio="xMidYMid meet"
      clip-path="url(#rounded)"
    />
  `;
}

function renderSvg(
  input: RPDRenderInput,
  slide: RenderSlide,
): string {
  const bg = background(input.template, slide.index);
  const fg = foreground(input.template);

  const image =
    input.modelImage ||
    input.productImages?.[0] ||
    slide.assets?.find((a) => a.type === 'image')?.url ||
    null;

  const headline = esc(slide.headline || input.productTitle || 'RPD Fashion Pick');
  const body = esc(slide.body || '');
  const price =
    input.price != null
      ? `₹${Number(input.price).toLocaleString('en-IN')}`
      : '';

  const deal =
    input.discount != null
      ? `${Number(input.discount).toFixed(0)}% OFF`
      : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="1080"
     height="1350"
     viewBox="0 0 1080 1350">
  <title>${esc(input.productTitle || 'RPD AI')}</title>
  <defs>
    <clipPath id="rounded">
      <rect x="100" y="220" width="880" height="620" rx="36"/>
    </clipPath>
  </defs>

  <rect width="1080" height="1350" fill="${bg}"/>

  <text x="100" y="120"
        font-family="Arial,sans-serif"
        font-size="34"
        font-weight="700"
        fill="${fg}">
    RPD AI
  </text>

  <text x="100" y="190"
        font-family="Arial,sans-serif"
        font-size="54"
        font-weight="800"
        fill="${fg}">
    ${headline}
  </text>

  ${image ? imageBlock(image, 220) : ''}

  ${
    body
      ? `<text x="100" y="920"
          font-family="Arial,sans-serif"
          font-size="34"
          font-weight="500"
          fill="${fg}">
          ${body}
        </text>`
      : ''
  }

  ${
    price
      ? `<text x="100" y="1030"
          font-family="Arial,sans-serif"
          font-size="58"
          font-weight="900"
          fill="${fg}">
          ${esc(price)}
        </text>`
      : ''
  }

  ${
    deal
      ? `<rect x="100" y="1080" width="250" height="72" rx="36" fill="#111111"/>
         <text x="225" y="1128"
           text-anchor="middle"
           font-family="Arial,sans-serif"
           font-size="28"
           font-weight="800"
           fill="#FFFFFF">
           ${esc(deal)}
         </text>`
      : ''
  }

  <text x="100" y="1245"
        font-family="Arial,sans-serif"
        font-size="32"
        font-weight="800"
        fill="${fg}">
    Tap to shop • RPD
  </text>
</svg>`;
}

function renderHtml(
  input: RPDRenderInput,
  slide: RenderSlide,
): string {
  const svg = renderSvg(input, slide);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport"
 content="width=1080,initial-scale=1">
<title>${esc(slide.headline || input.productTitle || 'RPD AI')}</title>
<style>
html,body{
 margin:0;
 width:1080px;
 height:1350px;
 overflow:hidden;
}
body{
 background:#fff;
}
svg{
 display:block;
 width:1080px;
 height:1350px;
}
</style>
</head>
<body>
${svg}
</body>
</html>`;
}

export async function renderRPD(
  input: RPDRenderInput,
  outputDir = join(process.cwd(), 'modules', 'rpd-production', 'output'),
): Promise<RPDRenderResult> {
  await mkdir(outputDir, { recursive: true });

  const slides =
    input.slides?.length
      ? input.slides
      : [
          {
            index: 1,
            role: 'hero',
            headline: input.productTitle || 'RPD Fashion Pick',
            body: 'Discover this fashion deal.',
          },
        ];

  const assets: RenderedAsset[] = [];
  const warnings: string[] = [];

  for (const slide of slides) {
    const id = `rpd-slide-${String(slide.index).padStart(2, '0')}`;

    const svgPath = join(outputDir, `${id}.svg`);
    const htmlPath = join(outputDir, `${id}.html`);

    await writeFile(svgPath, renderSvg(input, slide), 'utf8');
    await writeFile(htmlPath, renderHtml(input, slide), 'utf8');

    assets.push({
      id,
      type: 'svg',
      path: svgPath,
      slide: slide.index,
    });

    assets.push({
      id: `${id}-html`,
      type: 'html',
      path: htmlPath,
      slide: slide.index,
    });
  }

  if (!input.productImages?.length && !input.modelImage) {
    warnings.push('No trusted visual asset available for rendering.');
  }

  if (!input.price) {
    warnings.push('Price unavailable; rendered creative omits price.');
  }

  return {
    success: assets.length > 0,
    outputDir,
    assets,
    slideCount: slides.length,
    formats: ['svg', 'html'],
    warnings,
  };
}
