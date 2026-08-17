import type {
  ContentAngle,
  CTAType,
} from '../content-intelligence/types.js';
import type { CarouselTemplateId } from '../carousel-generator/types.js';
import type {
  CreativeDecision,
  CreativeDecisionRequest,
  CreativeObjective,
  CreativeSignal,
} from './types.js';

function value<T>(field: { value: T | null }): T | null {
  return field.value;
}

function hasPriceEvidence(request: CreativeDecisionRequest): boolean {
  const price = value(request.product.price);
  const mrp = value(request.product.mrp);
  return price != null && mrp != null && mrp > price;
}

function hasProductImages(request: CreativeDecisionRequest): boolean {
  return request.product.images.length > 0;
}

function hasColours(request: CreativeDecisionRequest): boolean {
  return request.product.colors.length > 0;
}

function hasSizes(request: CreativeDecisionRequest): boolean {
  return request.product.sizes.length > 0;
}

function hasDescription(request: CreativeDecisionRequest): boolean {
  const description = value(request.product.description);
  return Boolean(description?.trim());
}

function category(request: CreativeDecisionRequest): string | null {
  return value(request.product.category)?.toLowerCase().trim() ?? null;
}

function buildSignals(request: CreativeDecisionRequest): CreativeSignal[] {
  const signals: CreativeSignal[] = [];

  const price = hasPriceEvidence(request);
  signals.push({
    name: 'price-evidence',
    value: price,
    weight: 0.30,
    reason: price
      ? 'Verified price and MRP evidence is available.'
      : 'Price/MRP evidence is incomplete; price claims should not drive the creative.',
  });

  const images = hasProductImages(request);
  signals.push({
    name: 'product-images',
    value: images,
    weight: 0.20,
    reason: images
      ? 'Product imagery is available.'
      : 'No product imagery is available.',
  });

  const colours = hasColours(request);
  signals.push({
    name: 'colour-data',
    value: colours,
    weight: 0.10,
    reason: colours
      ? 'Explicit colour data is available.'
      : 'Colour data is unavailable.',
  });

  const sizes = hasSizes(request);
  signals.push({
    name: 'size-data',
    value: sizes,
    weight: 0.10,
    reason: sizes
      ? 'Explicit size data is available.'
      : 'Size data is unavailable.',
  });

  const description = hasDescription(request);
  signals.push({
    name: 'description',
    value: description,
    weight: 0.10,
    reason: description
      ? 'Product description is available.'
      : 'Product description is unavailable.',
  });

  const fashionCategory = [
    'kurti',
    'saree',
    'dress',
    'lehenga',
    'top',
    'jeans',
    'ethnic',
    'western',
  ].includes(category(request) ?? '');

  signals.push({
    name: 'fashion-category',
    value: fashionCategory,
    weight: 0.20,
    reason: fashionCategory
      ? 'Product category has a fashion-specific creative path.'
      : 'Product category is not mapped to a specialised fashion path.',
  });

  return signals;
}

function angleScore(
  angle: ContentAngle,
  request: CreativeDecisionRequest,
  signals: CreativeSignal[],
): { score: number; reasons: string[] } {
  const score = (name: string) =>
    signals.find((signal) => signal.name === name)?.value === true;

  let result = 0.25;
  const reasons: string[] = [];

  if (angle === 'price') {
    if (score('price-evidence')) {
      result += 0.60;
      reasons.push('strong verified price opportunity');
    } else {
      result -= 0.20;
      reasons.push('price evidence unavailable');
    }
  }

  if (angle === 'style') {
    if (score('product-images')) {
      result += 0.35;
      reasons.push('visual product presentation available');
    }
    if (score('fashion-category')) {
      result += 0.25;
      reasons.push('fashion category supports style storytelling');
    }
  }

  if (angle === 'occasion') {
    if (score('fashion-category')) {
      result += 0.30;
      reasons.push('fashion category supports occasion positioning');
    }
    if (score('description')) {
      result += 0.20;
      reasons.push('description provides contextual product information');
    }
  }

  if (angle === 'value') {
    if (score('price-evidence')) {
      result += 0.45;
      reasons.push('verified price comparison supports value framing');
    }
  }

  if (angle === 'trend') {
    if (score('product-images')) {
      result += 0.25;
      reasons.push('visual asset supports trend-led presentation');
    }
    if (score('fashion-category')) {
      result += 0.25;
      reasons.push('fashion category supports trend positioning');
    }
    if (score('colour-data')) {
      result += 0.15;
      reasons.push('colour information supports visual trend framing');
    }
  }

  if (angle === 'curiosity') {
    result += 0.25;
    reasons.push('curiosity remains viable with limited product evidence');
  }

  if (angle === 'problem-solution') {
    if (score('description')) {
      result += 0.30;
      reasons.push('description provides evidence for problem-solution framing');
    }
  }

  return {
    score: Number(Math.max(0, Math.min(1, result)).toFixed(4)),
    reasons,
  };
}

function chooseObjective(
  request: CreativeDecisionRequest,
): CreativeObjective {
  if (request.objective) return request.objective;

  return hasPriceEvidence(request) ? 'conversion' : 'discovery';
}

function chooseAngle(
  request: CreativeDecisionRequest,
  signals: CreativeSignal[],
  objective: CreativeObjective,
): { angle: ContentAngle; score: number; reasons: string[] } {
  const candidates: ContentAngle[] = [
    'price',
    'style',
    'value',
    'trend',
    'occasion',
    'problem-solution',
    'curiosity',
  ];

  if (request.preferredAngle) {
    const scored = angleScore(request.preferredAngle, request, signals);
    return {
      angle: request.preferredAngle,
      ...scored,
    };
  }

  // Verified discount evidence + conversion objective should deterministically
  // prioritize a price-led creative over generic fashion/trend angles.
  if (objective === 'conversion' && hasPriceEvidence(request)) {
    return {
      angle: 'price',
      ...angleScore('price', request, signals),
    };
  }

  return candidates
    .map((angle) => ({
      angle,
      ...angleScore(angle, request, signals),
    }))
    .sort((a, b) => b.score - a.score)[0];
}

function chooseCTA(
  request: CreativeDecisionRequest,
  objective: CreativeObjective,
): CTAType {
  if (request.preferredCTA) return request.preferredCTA;

  if (objective === 'conversion') return 'shop-now';
  if (objective === 'engagement') return 'comment';
  if (objective === 'save-share') return 'save-post';

  return 'share';
}

function chooseTemplate(
  request: CreativeDecisionRequest,
  angle: ContentAngle,
): CarouselTemplateId {
  if (request.preferredTemplate) return request.preferredTemplate;

  if (angle === 'price' || angle === 'value') {
    return 'rpd-pink-deal';
  }

  if (angle === 'occasion') {
    return 'rpd-lookbook';
  }

  if (angle === 'trend') {
    return 'rpd-colour-grid';
  }

  if (angle === 'style') {
    return 'rpd-editorial';
  }

  return 'rpd-minimal';
}

export function decideCreative(
  request: CreativeDecisionRequest,
): CreativeDecision {
  const signals = buildSignals(request);
  const objective = chooseObjective(request);
  const selected = chooseAngle(request, signals, objective);
  const cta = chooseCTA(request, objective);
  const template = chooseTemplate(request, selected.angle);

  const signalScore = signals.reduce(
    (total, signal) =>
      total + (signal.value === true ? signal.weight : 0),
    0,
  );

  const confidence = Number(
    Math.min(
      1,
      0.45 + selected.score * 0.35 + signalScore * 0.20,
    ).toFixed(4),
  );

  return {
    angle: selected.angle,
    objective,
    cta,
    template,
    score: selected.score,
    confidence,
    reasons: [
      ...selected.reasons,
      `objective:${objective}`,
      `cta:${cta}`,
      `template:${template}`,
    ],
    signals,
  };
}
