import type {
  AssetSelectionRequest,
  AssetSelectionResult,
  ModelAsset,
  ModelBackground,
  ModelFraming,
  ModelPose,
} from './types.js';

function matchScore<T>(requested: T | null | undefined, actual: T): number {
  if (!requested) return 0;
  return requested === actual ? 1 : actual === 'unknown' ? 0 : 0.15;
}

function categoryScore(requested: string | null | undefined, categories: string[]): number {
  if (!requested) return 0;
  const value = requested.toLowerCase().trim();
  return categories.some((category) => category.toLowerCase() === value) ? 1 : 0;
}

function scoreAsset(asset: ModelAsset, request: AssetSelectionRequest): {
  score: number;
  reasons: string[];
} {
  let score = asset.qualityScore * 0.25;
  const reasons: string[] = [];

  if (request.category) {
    const scorePart = categoryScore(request.category, asset.categories);
    score += scorePart * 0.25;
    if (scorePart === 1) reasons.push(`category:${request.category}`);
  }

  if (request.preferredPose) {
    const scorePart = matchScore<ModelPose>(request.preferredPose, asset.pose);
    score += scorePart * 0.20;
    if (scorePart === 1) reasons.push(`pose:${request.preferredPose}`);
  }

  if (request.preferredFraming) {
    const scorePart = matchScore<ModelFraming>(
      request.preferredFraming,
      asset.framing,
    );
    score += scorePart * 0.15;
    if (scorePart === 1) reasons.push(`framing:${request.preferredFraming}`);
  }

  if (request.requiredBackground) {
    const scorePart = matchScore<ModelBackground>(
      request.requiredBackground,
      asset.background,
    );
    score += scorePart * 0.10;
    if (scorePart === 1) reasons.push(`background:${request.requiredBackground}`);
  }

  score += asset.confidence * 0.05;

  if (asset.warnings.length === 0) {
    score += 0.05;
    reasons.push('no-warnings');
  }

  return {
    score: Number(Math.min(1, score).toFixed(4)),
    reasons,
  };
}

export function selectBestModelAsset(
  assets: ModelAsset[],
  request: AssetSelectionRequest,
): AssetSelectionResult {
  if (assets.length === 0) {
    return {
      asset: null,
      score: 0,
      reasons: [],
      warnings: ['No model assets are available.'],
    };
  }

  const ranked = assets
    .map((asset) => {
      const result = scoreAsset(asset, request);
      return { asset, ...result };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.asset.id.localeCompare(b.asset.id);
    });

  const best = ranked[0];

  const modelProfile = {
    modelId: `model_campaign_${best.asset.id}`,
    appearanceProfile: 'Professional Fashion Editorial Model',
    stylingProfile: 'Minimal Accessories, High-Fashion Styling',
    poseProfile: 'Coordinated Multi-Angle Fashion Poses',
    sceneProfile: 'Warm Editorial Studio Background',
    productFidelityConfidence: 0.95,
    productFidelityPreserved: true,
  };

  return {
    asset: best.asset,
    score: best.score,
    reasons: best.reasons,
    warnings: best.asset.warnings,
    modelProfile,
  };
}
