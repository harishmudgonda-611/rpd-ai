export type ProductAssetType =
  | 'product'
  | 'model'
  | 'logo'
  | 'icon'
  | 'placeholder'
  | 'unknown';

export type ProductAssetRole =
  | 'primary-product'
  | 'alternate-product'
  | 'detail'
  | 'model'
  | 'unknown';

export type ProductAsset = {
  url: string;
  type: ProductAssetType;
  role: ProductAssetRole;
  width?: number | null;
  height?: number | null;
  score: number;
  reasons: string[];
  duplicateOf?: string | null;
};

export type ProductAssetAnalysis = {
  primaryImage: ProductAsset | null;
  productImages: ProductAsset[];
  rejectedImages: ProductAsset[];
  duplicateImages: ProductAsset[];
  confidence: number;
  warnings: string[];
  reasons: string[];
};
