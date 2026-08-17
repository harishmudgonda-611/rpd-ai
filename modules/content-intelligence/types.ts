export type ContentAngle = 'price' | 'style' | 'occasion' | 'value' | 'trend' | 'curiosity' | 'problem-solution';
export type CTAType = 'shop-now' | 'save-post' | 'share' | 'comment' | 'whatsapp' | 'link-in-bio';

export type ContentProduct = {
  title: string;
  brand?: string | null;
  price?: number | null;
  currency?: string | null;
  mrp?: number | null;
  discountPercent?: number | null;
  category?: string | null;
  description?: string | null;
  colors?: string[];
  sizes?: string[];
  features?: string[];
  occasions?: string[];
  sourceUrl?: string | null;
};

export type ContentRequest = {
  product: ContentProduct;
  angle?: ContentAngle;
  cta?: CTAType;
  audience?: string;
  slideCount?: number;
  brandVoice?: 'friendly' | 'premium' | 'minimal' | 'bold' | 'deal';
  locale?: 'en-IN' | 'hi-IN' | 'hinglish';
};

export type CarouselSlideCopy = {
  slide: number;
  role: 'hook' | 'hero' | 'benefits' | 'colors' | 'details' | 'price' | 'cta';
  headline: string;
  body?: string;
  emphasis?: string[];
};

export type ContentPackage = {
  hook: string;
  alternativeHooks: string[];
  carousel: CarouselSlideCopy[];
  caption: string;
  cta: string;
  hashtags: string[];
  keywords: string[];
  metadata: { angle: ContentAngle; voice: NonNullable<ContentRequest['brandVoice']>; locale: NonNullable<ContentRequest['locale']>; generatedBy: string };
  warnings: string[];
};
