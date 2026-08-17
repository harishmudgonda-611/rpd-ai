import { generateContent } from '../content-intelligence/generator.js';
import { selectBestModelAsset } from '../ai-fashion-model/asset-selector.js';
import { selectTemplate } from '../template-intelligence/selector.js';
import type {
  CreativeConcept,
  CreativeExecutionPlan,
  CreativeOrchestratorRequest,
} from './types.js';

function value<T>(field: { value: T | null }): T | null {
  return field.value;
}

function chooseAngle(
  request: CreativeOrchestratorRequest,
): CreativeConcept['intent']['angle'] {
  if (request.angle) return request.angle;

  const price = value(request.product.price);
  const mrp = value(request.product.mrp);

  if (price != null && mrp != null && mrp > price) return 'price';

  if (value(request.product.category)) return 'style';

  return 'curiosity';
}

function chooseTemplate(
  request: CreativeOrchestratorRequest,
  angle: CreativeConcept['intent']['angle'],
  objective: CreativeConcept['intent']['objective'],
  selectedModel: ReturnType<typeof selectBestModelAsset>,
): CreativeConcept['intent']['template'] {
  if (request.template) return request.template;

  const category = value(request.product.category);

  const hasPriceEvidence =
    value(request.product.price) != null &&
    value(request.product.mrp) != null &&
    Number(value(request.product.mrp)) > Number(value(request.product.price));

  const selection = selectTemplate({
    angle,
    objective,
    category,
    hasPriceEvidence,
    hasProductImages: request.product.images.length > 0,
    hasModelAsset: selectedModel.asset != null,
    imageCount: request.product.images.length,
  });

  return selection.template.id as CreativeConcept['intent']['template'];
}

function chooseCTA(
  request: CreativeOrchestratorRequest,
): CreativeConcept['intent']['cta'] {
  return request.cta ?? 'shop-now';
}

function createConcept(
  request: CreativeOrchestratorRequest,
  selectedModel: ReturnType<typeof selectBestModelAsset>,
): CreativeConcept {
  const productTitle = value(request.product.title) ?? 'this fashion find';
  const category = value(request.product.category) ?? 'fashion';
  const angle = chooseAngle(request);
  const cta = chooseCTA(request);
  const objective = request.objective ?? 'conversion';
  const template = chooseTemplate(request, angle, objective, selectedModel);
  const audience = request.audience ?? 'Indian fashion shoppers';

  const hook =
    angle === 'price'
      ? `A ${category} deal worth a closer look`
      : angle === 'style'
        ? `${productTitle}: an easy style upgrade`
        : angle === 'occasion'
          ? `A ${category} made for your next look`
          : angle === 'value'
            ? `More style without overspending`
            : angle === 'trend'
              ? `A fashion pick worth noticing`
              : `Would you add this to your wardrobe?`;

  return {
    name: `${angle}-${objective}-${category}`,
    hook,
    rationale:
      `Selected ${angle} angle for ${objective} objective using available product evidence.`,
    intent: {
      angle,
      cta,
      template,
      audience,
      objective,
    },
    assetRequest: {
      category,
      preferredPose: 'front',
      preferredFraming: 'full-body',
      requiredBackground: 'studio',
    },
  };
}

export function planCreative(
  request: CreativeOrchestratorRequest,
): CreativeExecutionPlan {
  const preliminaryAssetRequest = {
    category: value(request.product.category),
    preferredPose: 'front' as const,
    preferredFraming: 'full-body' as const,
    requiredBackground: 'studio' as const,
  };

  const selectedModel = selectBestModelAsset(
    request.modelAssets ?? [],
    preliminaryAssetRequest,
  );

  const concept = createConcept(request, selectedModel);

  const p = request.product;

  const content = generateContent({
    product: {
      title: value(p.title) ?? 'Untitled product',
      brand: value(p.brand),
      price: value(p.price),
      currency: value(p.currency),
      mrp: value(p.mrp),
      discountPercent: value(p.discountPercent),
      category: value(p.category),
      description: value(p.description),
      colors: p.colors.map((x) => x.name),
      sizes: p.sizes.map((x) => x.name),
      sourceUrl: p.sourceUrl,
    },
    angle: concept.intent.angle,
    cta: concept.intent.cta,
    audience: concept.intent.audience,
    brandVoice: 'deal',
    locale: 'en-IN',
    slideCount: 6,
  });

  const warnings = [
    ...p.extraction.warnings,
    ...selectedModel.warnings,
    ...content.warnings,
  ];

  const steps = [
    'validate product evidence',
    'select creative angle',
    'select CTA',
    'select intelligent carousel template',
    'select compatible model asset',
    'generate structured content',
    'pass execution package to rendering pipeline',
  ];

  return {
    concept,
    selectedModel,
    content,
    steps,
    warnings: [...new Set(warnings)],
  };
}
