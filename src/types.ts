export type ProductField<T> = { value: T | null; source: string | null; confidence: number };

export type ProductVariant = {
  name: string;
  color?: string | null;
  size?: string | null;
  sku?: string | null;
  url?: string | null;
  image?: string | null;
};

export type NormalizedProduct = {
  sourceUrl: string;
  canonicalUrl: ProductField<string>;
  title: ProductField<string>;
  brand: ProductField<string>;
  description: ProductField<string>;
  price: ProductField<number>;
  currency: ProductField<string>;
  mrp: ProductField<number>;
  discountPercent: ProductField<number>;
  availability: ProductField<string>;
  category: ProductField<string>;
  images: Array<{ url: string; source: string }>;
  colors: Array<{ name: string; source: string }>;
  sizes: Array<{ name: string; source: string }>;
  variants: ProductVariant[];
  rating: ProductField<number>;
  reviewCount: ProductField<number>;
  seller: ProductField<string>;
  rawSignals: Record<string, unknown>;
  extraction: {
    method: string;
    fetchedAt: string;
    fieldsFound: number;
    fieldsExpected: number;
    confidence: number;
    warnings: string[];
  };
};
