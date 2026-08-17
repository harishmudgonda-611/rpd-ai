# Module 01 — Product Intelligence

## Purpose

Turn a public fashion-product URL into a normalized, provenance-aware product object that downstream RPD modules can trust.

## Open-source assessment

For this first module we evaluated lightweight ecommerce scraping approaches and chose to implement the core extractor from scratch rather than importing a large scraper stack. The implementation uses the open-source Cheerio parser and standard Node.js `fetch`, keeping the Termux footprint small. Public scraper projects can still be added later as retailer-specific adapters when their licenses and maintenance justify it.

## Supported signals

- Schema.org / JSON-LD Product
- Offer price/currency/availability
- Aggregate rating/review count
- Brand/category/seller
- Canonical URL
- OpenGraph and Twitter metadata
- Common `itemprop` DOM fields
- Product images
- Basic colour and size signals
- Derived discount percentage when MRP and price are available

## Contract

Input:

```json
{"url":"https://store.example/product"}
```

Output: `NormalizedProduct` from `src/types.ts`.

Every important field carries a source and confidence score. Missing facts remain `null` rather than being guessed.

## Future adapter point

Dynamic ecommerce pages can later use a browser-renderer adapter behind the same `fetchAndExtractProduct()` contract. This keeps Module 01 independent from heavyweight browser dependencies on Android.

## Verification

```bash
npm install
npm test
npm run dev
```

Health:

```bash
curl http://127.0.0.1:8787/health
```
