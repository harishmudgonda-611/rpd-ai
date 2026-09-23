export type QualificationInput = {
  price?: number | null;
  mrp?: number | null;
  discountPercent?: number | null;
  imageCount?: number;
  title?: string;
  platform?: string | null;
};

export type QualificationResult = {
  score: number;
  tier: 'A' | 'B' | 'C';
  publish: boolean;
  reasons: string[];
  checks: Record<string, boolean>;
};

export function qualifyProduct(input: QualificationInput): QualificationResult {
  const reasons: string[] = [];
  const price = Number(input.price ?? 0);
  const mrp = Number(input.mrp ?? 0);
  const discount = Number(input.discountPercent ?? (mrp > price && price > 0 ? ((mrp-price)/mrp)*100 : 0));
  const images = Number(input.imageCount ?? 0);
  const title = String(input.title ?? '').trim();
  const platform = String(input.platform ?? '').toLowerCase();

  const checks = {
    validPrice: price > 0,
    credibleDiscount: discount >= 15 && discount <= 90,
    usableImages: images >= 2,
    usableTitle: title.length >= 8,
    supportedMarketplace: /myntra|amazon|flipkart|ajio|meesho|nykaa/.test(platform),
  };

  let score = 0;
  if (checks.validPrice) score += 25;
  if (checks.credibleDiscount) score += 25;
  if (checks.usableImages) score += 20;
  if (checks.usableTitle) score += 15;
  if (checks.supportedMarketplace) score += 15;

  if (!checks.validPrice) reasons.push('Verified selling price is missing.');
  if (!checks.credibleDiscount) reasons.push('Discount evidence is missing or outside the normal deal range.');
  if (!checks.usableImages) reasons.push('At least two usable product images are recommended.');
  if (!checks.usableTitle) reasons.push('Product title is too short for reliable content generation.');
  if (!checks.supportedMarketplace) reasons.push('Marketplace is not one of the configured RPD sources.');

  const tier = score >= 80 ? 'A' : score >= 60 ? 'B' : 'C';
  return { score, tier, publish: tier !== 'C', reasons, checks };
}
