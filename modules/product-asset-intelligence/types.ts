export type ProductAssetType =
  | 'product'
  | 'model'
  | 'logo'
  | 'icon'
  | 'placeholder'
  | 'unknown';

export type ProductAsset = {
  url: string;
  type: ProductAssetType;
  width?: number | null;
  height?: number | null;
  score: number;
  reasons: string[];
};

export type ProductAssetAnalysis = {
  primaryImage: ProductAsset | null;
  productImages: ProductAsset[];
  rejectedImages: ProductAsset[];
  confidence: number;
  warnings: string[];
  reasons: string[];
};
