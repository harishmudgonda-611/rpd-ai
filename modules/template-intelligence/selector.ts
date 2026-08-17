import { RPD_TEMPLATES } from './registry.js';
import type {
  RPDTemplate,
  TemplateSelectionContext,
  TemplateSelectionResult,
} from './types.js';

function scoreTemplate(
  template: RPDTemplate,
  context: TemplateSelectionContext,
): TemplateSelectionResult {
  let score = template.priority * 0.02;
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (context.angle && template.supportedAngles.includes(context.angle)) {
    score += 0.30;
    reasons.push(`angle:${context.angle}`);
  }

  if (
    context.objective &&
    template.supportedObjectives.includes(context.objective)
  ) {
    score += 0.25;
    reasons.push(`objective:${context.objective}`);
  }

  if (context.hasPriceEvidence && template.supportsPrice) {
    score += 0.15;
    reasons.push('price-supported');
  }

  if (context.hasModelAsset && template.supportsModel) {
    score += 0.10;
    reasons.push('model-supported');
  }

  if (context.imageCount >= template.minImages) {
    score += 0.10;
    reasons.push('image-count-supported');
  } else {
    warnings.push(`Template requires at least ${template.minImages} image(s).`);
    score -= 0.20;
  }

  if (context.hasProductImages) {
    score += 0.05;
  }

  return {
    template,
    score: Number(Math.max(0, Math.min(1, score)).toFixed(4)),
    reasons,
    warnings,
  };
}

export function selectTemplate(
  context: TemplateSelectionContext,
): TemplateSelectionResult {
  const ranked = RPD_TEMPLATES
    .map((template) => scoreTemplate(template, context))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.template.id.localeCompare(b.template.id);
    });

  return ranked[0];
}
