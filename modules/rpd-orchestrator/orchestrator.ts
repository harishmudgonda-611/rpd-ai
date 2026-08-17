import { analyzeVariants } from '../variant-colour-intelligence/analyzer.js';
import { generateContent } from '../content-intelligence/generator.js';
import { generateCarousel, validateCarousel } from '../carousel-generator/generator.js';
import { selectBestModelAsset } from '../ai-fashion-model/asset-selector.js';
import type { RPDGenerationRequest, RPDGenerationResult } from './types.js';

function field<T>(value: { value: T | null }): T | null {
  return value.value;
}

export function generateRPD(request: RPDGenerationRequest): RPDGenerationResult {
  const p = request.product;

  const variants = analyzeVariants(
    p.variants.map((variant) => ({
      name: variant.name,
      color: variant.color ?? undefined,
      size: variant.size ?? undefined,
      sku: variant.sku ?? undefined,
      url: variant.url ?? undefined,
      image: variant.image ?? undefined,
    })),
    p.colors.map((color) => color.name),
  );

  const content = generateContent({
    product: {
      title: field(p.title) ?? 'Untitled product',
      brand: field(p.brand),
      price: field(p.price),
      currency: field(p.currency),
      mrp: field(p.mrp),
      discountPercent: field(p.discountPercent),
      category: field(p.category),
      description: field(p.description),
      colors: variants.colors.map((color) => color.name),
      sizes: p.sizes.map((size) => size.name),
      sourceUrl: p.sourceUrl,
    },
    ...request.content,
  });

  const selectedModel = selectBestModelAsset(
    request.modelAssets ?? [],
    request.modelSelection ?? {
      category: field(p.category),
      preferredPose: 'front',
      preferredFraming: 'full-body',
      requiredBackground: 'studio',
    },
  );

  const carousel = generateCarousel({
    productTitle: field(p.title) ?? 'Untitled product',
    price: field(p.price) != null
      ? `${field(p.currency) ?? 'INR'} ${field(p.price)}`
      : null,
    mrp: field(p.mrp) != null
      ? `${field(p.currency) ?? 'INR'} ${field(p.mrp)}`
      : null,
    discount: field(p.discountPercent) != null
      ? `${field(p.discountPercent)}% off`
      : null,
    colours: variants.colors.map((color) => color.name),
    modelImage: selectedModel.asset?.path ?? null,
    productImages: p.images.map((image) => image.url),
    content: {
      hook: content.hook,
      caption: content.caption,
      slides: content.carousel.map((slide) => ({
        role: slide.role === 'colors' ? 'colours' : slide.role,
        headline: slide.headline,
        body: slide.body,
        emphasis: slide.emphasis,
      })),
    },
    template: request.template,
    sourceProductUrl: p.sourceUrl,
  });

  const validation = validateCarousel(carousel);

  const warnings = [
    ...p.extraction.warnings,
    ...variants.warnings,
    ...content.warnings,
    ...selectedModel.warnings,
    ...validation.errors,
  ];

  return {
    product: p,
    variants,
    selectedModel,
    content,
    carousel,
    warnings: [...new Set(warnings)],
  };
}
