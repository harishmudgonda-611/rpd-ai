import type { ColorEvidence, RPDVariant, VariantAnalysis, VariantInput } from './types.js';

const COLOR_ALIASES: Record<string, string> = {
  blk: 'black', wht: 'white', red: 'red', maroon: 'maroon', wine: 'maroon', burgundy: 'maroon', navy: 'navy blue', 'navy blue': 'navy blue', blue: 'blue', sky: 'sky blue', 'sky blue': 'sky blue', royal: 'royal blue', green: 'green', olive: 'olive', mint: 'mint green', teal: 'teal', pink: 'pink', rose: 'rose', peach: 'peach', orange: 'orange', yellow: 'yellow', mustard: 'mustard', purple: 'purple', lavender: 'lavender', violet: 'violet', brown: 'brown', beige: 'beige', cream: 'cream', ivory: 'ivory', grey: 'grey', gray: 'grey', silver: 'silver', gold: 'gold', black: 'black', white: 'white'
};

const clean = (v: unknown) => typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '';

export function normalizeColorName(input: string): string {
  const value = clean(input).toLowerCase().replace(/[()]/g, ' ');
  if (!value) return '';
  if (COLOR_ALIASES[value]) return COLOR_ALIASES[value];
  const tokens = value.split(/[,/|\-]+/).map(x => x.trim()).filter(Boolean);
  if (tokens.length > 1) {
    const mapped = tokens.map(t => COLOR_ALIASES[t] ?? t).filter(Boolean);
    return [...new Set(mapped)].join(' / ');
  }
  return COLOR_ALIASES[value] ?? value;
}

export function colorEvidence(name: string, source: ColorEvidence['source'], confidence: number, hex?: string | null): ColorEvidence {
  return { name: clean(name), normalizedName: normalizeColorName(name), hex: hex ?? null, confidence, source };
}

function idFor(value: string, index: number) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `variant-${normalized || 'unknown'}-${index + 1}`;
}

export function analyzeVariants(inputs: VariantInput[] = [], explicitColors: string[] = []): VariantAnalysis {
  const warnings: string[] = [];
  const variants: RPDVariant[] = [];
  const seen = new Set<string>();

  const add = (input: VariantInput, source: RPDVariant['source'], confidence: number) => {
    const colorName = clean(input.color);
    const normalizedColor = normalizeColorName(colorName);
    const key = [normalizedColor, clean(input.size).toLowerCase(), clean(input.sku).toLowerCase(), clean(input.image)].join('|');
    if (seen.has(key)) return;
    seen.add(key);
    const index = variants.length;
    variants.push({
      variantId: idFor(`${normalizedColor || clean(input.name) || 'product'}-${clean(input.size)}`, index),
      name: clean(input.name) || [colorName, clean(input.size)].filter(Boolean).join(' / ') || `Variant ${index + 1}`,
      color: normalizedColor ? colorEvidence(colorName, source, confidence) : null,
      size: clean(input.size) || null,
      sku: clean(input.sku) || null,
      url: clean(input.url) || null,
      image: clean(input.image) || null,
      source,
      confidence
    });
  };

  for (const input of inputs) add(input, 'explicit-product-data', 0.98);
  for (const color of explicitColors) {
    const normalized = normalizeColorName(color);
    if (!normalized) continue;
    if (!variants.some(v => v.color?.normalizedName === normalized)) {
      add({ name: color, color }, 'explicit-product-data', 0.92);
    }
  }

  const colors: ColorEvidence[] = [];
  for (const variant of variants) {
    if (!variant.color) continue;
    if (!colors.some(c => c.normalizedName === variant.color!.normalizedName)) colors.push(variant.color);
  }

  if (variants.length === 0) warnings.push('No explicit product variants or colours were supplied. Image-analysis adapter can be used next.');
  if (colors.length === 0 && variants.length > 0) warnings.push('Variants were found but no colour attribute was available.');

  return {
    variants,
    colors,
    uniqueColorCount: colors.length,
    warnings,
    method: 'explicit-product-data+normalization+deduplication'
  };
}

export function mergeImageColorEvidence(base: VariantAnalysis, imageColors: Array<{ name: string; hex?: string | null; confidence?: number }> = []): VariantAnalysis {
  const warnings = [...base.warnings];
  const colors = [...base.colors];
  for (const item of imageColors) {
    const normalized = normalizeColorName(item.name);
    if (!normalized) continue;
    const existing = colors.find(c => c.normalizedName === normalized);
    if (existing) {
      existing.hex = item.hex ?? existing.hex;
      existing.confidence = Math.max(existing.confidence, item.confidence ?? 0.75);
      continue;
    }
    colors.push(colorEvidence(item.name, 'image-analysis', item.confidence ?? 0.75, item.hex));
  }
  if (imageColors.length > 0 && colors.length === 0) warnings.push('Image colour evidence was supplied but no usable colours were recognized.');
  return { ...base, colors, uniqueColorCount: colors.length, warnings, method: `${base.method}+image-evidence` };
}
