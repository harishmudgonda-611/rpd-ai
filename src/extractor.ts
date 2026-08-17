import * as cheerio from 'cheerio';
import type { NormalizedProduct } from './types.js';

const first = (...values: Array<unknown>) => values.find(v => typeof v === 'string' ? v.trim().length > 0 : v !== null && v !== undefined);
const clean = (v: unknown) => typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : null;
const num = (v: unknown) => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = clean(v);
  if (!s) return null;
  const m = s.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
};
const absolute = (value: string | null, base: string) => {
  if (!value) return null;
  try { return new URL(value, base).toString(); } catch { return null; }
};

function jsonLdProducts($: cheerio.CheerioAPI) {
  const found: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text();
    try {
      const parsed = JSON.parse(raw);
      const visit = (x: any) => {
        if (!x) return;
        if (Array.isArray(x)) return x.forEach(visit);
        if (typeof x !== 'object') return;
        if (x['@type'] === 'Product' || (Array.isArray(x['@type']) && x['@type'].includes('Product'))) found.push(x);
        if (x['@graph']) visit(x['@graph']);
        if (x.item) visit(x.item);
      };
      visit(parsed);
    } catch { /* malformed JSON-LD is ignored */ }
  });
  return found;
}

function meta($: cheerio.CheerioAPI, key: string) {
  return clean($(`meta[property="${key}"], meta[name="${key}"]`).first().attr('content'));
}

function uniqueStrings(values: Array<string | null>) {
  return [...new Set(values.filter(Boolean) as string[])];
}

export function extractProduct(html: string, sourceUrl: string): NormalizedProduct {
  const $ = cheerio.load(html);
  const products = jsonLdProducts($);
  const p = products[0] ?? {};
  const offer = Array.isArray(p.offers) ? p.offers[0] ?? {} : (p.offers ?? {});
  const aggregate = p.aggregateRating ?? {};
  const imageValues = Array.isArray(p.image) ? p.image : [p.image];

  const title = clean(first(p.name, meta($, 'og:title'), meta($, 'twitter:title'), $('h1').first().text(), $('title').first().text()));
  const description = clean(first(p.description, meta($, 'og:description'), meta($, 'description')));
  const brand = clean(first(typeof p.brand === 'object' ? p.brand?.name : p.brand, $('[itemprop="brand"]').first().text()));
  const price = num(first(offer.price, meta($, 'product:price:amount'), $('[itemprop="price"]').first().attr('content'), $('[itemprop="price"]').first().text()));
  const currency = clean(first(offer.priceCurrency, meta($, 'product:price:currency'), $('[itemprop="priceCurrency"]').first().attr('content')));
  const availability = clean(first(offer.availability, $('[itemprop="availability"]').first().attr('content'), $('[itemprop="availability"]').first().text()));
  const canonical = absolute(clean($('link[rel="canonical"]').attr('href')) ?? sourceUrl, sourceUrl);
  const images = uniqueStrings([
    ...imageValues.map(v => typeof v === 'string' ? absolute(v, sourceUrl) : null),
    absolute(meta($, 'og:image'), sourceUrl),
    absolute(meta($, 'twitter:image'), sourceUrl),
    ...$('img').map((_, el) => absolute(clean($(el).attr('src')), sourceUrl)).get()
  ]);

  const colorText = first(p.color, $('[itemprop="color"]').first().text(), $('[data-color]').first().attr('data-color'));
  const colors = uniqueStrings(Array.isArray(colorText) ? colorText.map(clean) : [clean(colorText)]).map(name => ({ name, source: 'jsonld/dom' }));
  const sizes = uniqueStrings([
    ...(Array.isArray(p.size) ? p.size.map(clean) : [clean(p.size)]),
    ...$('[itemprop="size"]').map((_, el) => clean($(el).text())).get()
  ]).map(name => ({ name, source: 'jsonld/dom' }));

  const mrp = num(first(p.mrp, p.listPrice, $('[data-mrp]').first().attr('data-mrp'), $('[itemprop="priceSpecification"]').first().attr('data-price')));
  const discountPercent = mrp && price && mrp > price ? Math.round(((mrp - price) / mrp) * 10000) / 100 : null;
  const rating = num(first(aggregate.ratingValue, $('[itemprop="ratingValue"]').first().attr('content'), $('[itemprop="ratingValue"]').first().text()));
  const reviewCount = num(first(aggregate.reviewCount, aggregate.ratingCount, $('[itemprop="reviewCount"]').first().attr('content')));
  const category = clean(first(p.category, $('[itemprop="category"]').first().text()));
  const seller = clean(first(typeof offer.seller === 'object' ? offer.seller?.name : offer.seller));

  const fields: Array<unknown> = [canonical, title, brand, description, price, currency, availability, category, rating, reviewCount];
  const fieldsFound = fields.filter(v => v !== null && v !== undefined && v !== '').length;
  const warnings: string[] = [];
  if (!title) warnings.push('Product title not found');
  if (price === null) warnings.push('Product price not found');
  if (images.length === 0) warnings.push('Product images not found');
  if (colors.length === 0) warnings.push('Product colours not found; variant discovery may require a browser-rendered adapter');

  return {
    sourceUrl,
    canonicalUrl: { value: canonical, source: canonical === sourceUrl ? 'input-url' : 'canonical-link', confidence: canonical ? 0.95 : 0 },
    title: { value: title, source: p.name ? 'jsonld' : meta($, 'og:title') ? 'og:title' : 'dom', confidence: title ? (p.name ? 0.98 : 0.85) : 0 },
    brand: { value: brand, source: p.brand ? 'jsonld' : 'dom', confidence: brand ? 0.9 : 0 },
    description: { value: description, source: p.description ? 'jsonld' : 'meta', confidence: description ? 0.85 : 0 },
    price: { value: price, source: offer.price ? 'jsonld' : 'meta/dom', confidence: price !== null ? (offer.price ? 0.98 : 0.8) : 0 },
    currency: { value: currency, source: offer.priceCurrency ? 'jsonld' : 'meta/dom', confidence: currency ? 0.95 : 0 },
    mrp: { value: mrp, source: 'jsonld/dom', confidence: mrp !== null ? 0.7 : 0 },
    discountPercent: { value: discountPercent, source: 'derived', confidence: discountPercent !== null ? 0.95 : 0 },
    availability: { value: availability, source: offer.availability ? 'jsonld' : 'dom', confidence: availability ? 0.9 : 0 },
    category: { value: category, source: p.category ? 'jsonld' : 'dom', confidence: category ? 0.8 : 0 },
    images: images.map(url => ({ url, source: 'jsonld/og/dom' })),
    colors,
    sizes,
    variants: [],
    rating: { value: rating, source: aggregate.ratingValue ? 'jsonld' : 'dom', confidence: rating !== null ? 0.9 : 0 },
    reviewCount: { value: reviewCount, source: aggregate.reviewCount ? 'jsonld' : 'dom', confidence: reviewCount !== null ? 0.9 : 0 },
    seller: { value: seller, source: 'jsonld', confidence: seller ? 0.9 : 0 },
    rawSignals: { jsonLdProductCount: products.length, imageCount: images.length },
    extraction: {
      method: 'jsonld+opengraph+meta+dom',
      fetchedAt: new Date().toISOString(),
      fieldsFound,
      fieldsExpected: fields.length,
      confidence: Math.round((fieldsFound / fields.length) * 100) / 100,
      warnings
    }
  };
}

export async function fetchAndExtractProduct(sourceUrl: string): Promise<NormalizedProduct> {
  const url = new URL(sourceUrl);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP(S) product URLs are supported');
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'RPD-Product-Intelligence/0.1 (+local-user-request)',
      'accept': 'text/html,application/xhtml+xml'
    }
  });
  if (!response.ok) throw new Error(`Upstream returned HTTP ${response.status}`);
  const html = await response.text();
  return extractProduct(html, response.url || sourceUrl);
}
