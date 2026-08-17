export type ModelPose = 'front' | 'three-quarter' | 'side' | 'back' | 'sitting' | 'walking' | 'unknown';
export type ModelAsset = {
  assetId: string;
  path: string;
  filename: string;
  extension: string;
  pose: ModelPose;
  tags: string[];
  width?: number;
  height?: number;
  categoryCompatibility: string[];
  source: 'rpd-model-library' | 'generated' | 'other';
};

export type TryOnRequest = {
  personImage: string;
  garmentImage: string;
  category: 'upper_body' | 'lower_body' | 'dress' | 'full_body' | 'unknown';
  outputPath: string;
  pose?: ModelPose;
  prompt?: string;
  preserveFace?: boolean;
  preserveGarment?: boolean;
};

export type TryOnResult = {
  status: 'completed' | 'queued' | 'unsupported' | 'failed';
  provider: string;
  outputPath?: string;
  requestId: string;
  warnings: string[];
  metadata: Record<string, unknown>;
};

export interface TryOnProvider {
  readonly id: string;
  readonly capabilities: string[];
  isAvailable(): Promise<boolean>;
  generate(request: TryOnRequest): Promise<TryOnResult>;
}
