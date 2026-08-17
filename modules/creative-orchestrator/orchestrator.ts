import { generateContent } from '../content-intelligence/generator.js';
import { selectBestModelAsset } from '../ai-fashion-model/asset-selector.js';
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
): CreativeConcept['intent']['template'] {
  if (request.template) return request.template;

  const angle = chooseAngle(request);

  if (angle === 'price' || angle === 'value') {
    return 'rpd-pink-deal';
  }

  if (angle === 'occasion') {
    return 'rpd-lookbook';
  }

  if (angle === 'trend') {
    return 'rpd-colour-grid';
  }

  return 'rpd-editorial';
}

function chooseCTA(
  request: CreativeOrchestratorRequest,
): CreativeConcept['intent']['cta'] {
  return request.cta ?? 'shop-now';
}

function createConcept(
  request: CreativeOrchestratorRequest,
): CreativeConcept {
  const productTitle = value(request.product.title) ?? 'this fashion find';
  const category = value(request.product.category) ?? 'fashion';
  const angle = chooseAngle(request);
  const cta = chooseCTA(request);
  const template = chooseTemplate(request);

  const objective = request.objective ?? 'conversion';
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
  const concept = createConcept(request);

  const selectedModel = selectBestModelAsset(
    request.modelAssets ?? [],
    concept.assetRequest,
  );

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
    'select carousel template',
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
