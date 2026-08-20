export type ModelAssetType = 'image';

export type ModelPose =
  | 'front'
  | 'back'
  | 'side'
  | 'three-quarter'
  | 'unknown';

export type ModelFraming =
  | 'full-body'
  | 'three-quarter-body'
  | 'upper-body'
  | 'close-up'
  | 'unknown';

export type ModelBackground =
  | 'studio'
  | 'plain'
  | 'outdoor'
  | 'interior'
  | 'unknown';

export type AssetSource = 'local-library';

export type ModelAsset = {
  id: string;
  path: string;
  type: ModelAssetType;

  width?: number | null;
  height?: number | null;

  pose: ModelPose;
  framing: ModelFraming;
  background: ModelBackground;

  categories: string[];

  qualityScore: number;
  confidence: number;

  source: AssetSource;
  warnings: string[];
};

export type AssetSelectionRequest = {
  category?: string | null;
  preferredPose?: ModelPose | null;
  preferredFraming?: ModelFraming | null;
  requiredBackground?: ModelBackground | null;
};

export type CampaignModelProfile = {
  modelId: string;
  appearanceProfile: string;
  stylingProfile: string;
  poseProfile: string;
  sceneProfile: string;
  productFidelityConfidence: number;
  productFidelityPreserved: boolean;
};

export type AssetSelectionResult = {
  asset: ModelAsset | null;
  score: number;
  reasons: string[];
  warnings: string[];
  modelProfile?: CampaignModelProfile;
};
