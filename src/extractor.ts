import * as cheerio from 'cheerio';
import type { NormalizedProduct } from './types.js';
import { ProductExtractionError } from './extraction-error.js';

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

export function parseJsonLdMetadata($: cheerio.CheerioAPI) {
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

function jsonLdProducts($: cheerio.CheerioAPI) {
  return parseJsonLdMetadata($);
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
  const imageValues: unknown[] = Array.isArray(p.image) ? p.image : [p.image];

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

  const rawColorText = first(p.color, $('[itemprop="color"]').first().text(), $('[data-color]').first().attr('data-color'));
  const isTechColor = (v: string) => {
    const s = v.trim();
    return /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s) ||
           /^(rgb|rgba|hsl|hsla)\s*\(/i.test(s) ||
           /^var\s*\(/i.test(s) ||
           /\b(color|background|fill|stroke)\s*:/i.test(s) || s.includes(';') ||
           /^0x[0-9a-f]+/i.test(s);
  };
  const colorArray = Array.isArray(rawColorText) ? rawColorText.map(clean) : [clean(rawColorText)];
  const colors = uniqueStrings(colorArray.filter((c): c is string => Boolean(c) && !isTechColor(c!))).map(name => ({ name, source: 'jsonld/dom' }));
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

function platformFromHostname(hostname: string): string | null {
  const host = hostname.toLowerCase();

  if (host.includes('meesho')) return 'meesho';
  if (host.includes('amazon')) return 'amazon';
  if (host.includes('flipkart')) return 'flipkart';
  if (host.includes('myntra')) return 'myntra';
  if (host.includes('ajio')) return 'ajio';

  return null;
}

function looksLikeAccessBlockedPage(html: string): boolean {
  const sample = html.slice(0, 20000).toLowerCase();

  const indicators = [
    'access denied',
    'request denied',
    'you don\'t have permission to access',
    'errors.edgesuite.net',
    'akamai',
    'reference #',
    'forbidden',
  ];

  return indicators.filter((x) => sample.includes(x)).length >= 2;
}

function extractionQuality(product: NormalizedProduct): number {
  let score = 0;

  if (product.title.value) score += 1;
  if (product.price.value != null) score += 1;
  if (product.category.value) score += 1;
  if (product.images.length > 0) score += 1;

  return score;
}

export async function fetchWithRetry(
  url: URL,
  retries = 2,
  timeoutMs = 10000,
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent': 'RPD-Product-Intelligence/0.2 (+local-user-request)',
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timer);
      if (res.ok || attempt === retries) {
        return res;
      }
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      if (attempt === retries) {
        throw new ProductExtractionError(
          'UPSTREAM_HTTP_ERROR',
          `Failed to fetch URL after ${retries + 1} attempts: ${err.message || 'Network error'}`,
        );
      }
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastError || new Error('Fetch failed');
}

export async function fetchAndExtractProduct(
  sourceUrl: string,
): Promise<NormalizedProduct> {
  let url: URL;

  try {
    url = new URL(sourceUrl);
  } catch {
    throw new ProductExtractionError(
      'INVALID_URL',
      'Invalid product URL.',
    );
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ProductExtractionError(
      'INVALID_URL',
      'Only HTTP(S) product URLs are supported.',
    );
  }

  const platform = platformFromHostname(url.hostname);

  const response = await fetchWithRetry(url);

  const html = await response.text();

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ProductExtractionError(
        'UPSTREAM_ACCESS_BLOCKED',
        platform
          ? `${platform} blocked automated product access (HTTP ${response.status}).`
          : `The product source blocked automated access (HTTP ${response.status}).`,
        {
          status: response.status,
          platform: platform ?? undefined,
        },
      );
    }

    throw new ProductExtractionError(
      'UPSTREAM_HTTP_ERROR',
      `Product source returned HTTP ${response.status}.`,
      {
        status: response.status,
        platform: platform ?? undefined,
      },
    );
  }

  if (looksLikeAccessBlockedPage(html)) {
    throw new ProductExtractionError(
      'UPSTREAM_ACCESS_BLOCKED',
      platform
        ? `${platform} returned an access-blocked page instead of product data.`
        : 'The product source returned an access-blocked page instead of product data.',
      {
        status: response.status,
        platform: platform ?? undefined,
      },
    );
  }

  const product = extractProduct(
    html,
    response.url || sourceUrl,
  );

  if (extractionQuality(product) < 2) {
    throw new ProductExtractionError(
      'PRODUCT_DATA_NOT_FOUND',
      platform
        ? `No reliable product data could be extracted from ${platform}.`
        : 'No reliable product data could be extracted from this source.',
      {
        platform: platform ?? undefined,
      },
    );
  }

  return product;
}

export async function fetchAndExtractProductsBatch(
  sourceUrls: string | string[],
): Promise<NormalizedProduct[]> {
  const urls = (Array.isArray(sourceUrls) ? sourceUrls : [sourceUrls])
    .map(u => typeof u === 'string' ? u.trim() : '')
    .filter(Boolean);

  if (urls.length === 0) {
    throw new ProductExtractionError('INVALID_URL', 'At least one valid product URL is required.');
  }

  const results: NormalizedProduct[] = [];
  for (const url of urls) {
    const product = await fetchAndExtractProduct(url);
    results.push(product);
  }

  return results;
}
