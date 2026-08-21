export type ProductAssetCategory =
  | 'SOURCE_PRODUCT_ASSET'
  | 'GENERATED_MODEL_ASSET'
  | 'COMPOSITED_PRODUCT_MODEL_ASSET'
  | 'BACKGROUND_ASSET'
  | 'FINAL_RENDER_ASSET';

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
  category?: ProductAssetCategory;
  product_id?: string;
  asset_id?: string;
  generation_id?: string;
  creative_id?: string;
  slide_id?: string;
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
