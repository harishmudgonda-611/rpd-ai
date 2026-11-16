# RPD product research and extraction adapters

RPD already has a product URL → extraction → product intelligence → qualification → creative → tracked-link flow. This adapter plan extends that boundary without weakening its existing verification and affiliate-compliance rules.

## Adapter map
- **Scrapy**: optional collection from approved merchant feeds/catalog pages where terms explicitly permit automated access.
- **Crawl4AI**: optional page-to-Markdown extraction for permitted public product/editorial pages.
- **Scrapling / AutoScraper**: fixture-driven site-specific parsers, versioned and tested against saved HTML.
- **MarkItDown**: operator-supplied product catalogs, CSVs, PDFs and campaign documents.
- Browser Use / Skyvern: not enabled in production; if later added, require human supervision and prohibit checkout, login or account actions.

## Product fact contract
Keep original URL, merchant/source identity, retrieved_at, title, SKU/variant, observed price, currency, availability, image URLs, extraction method, content hash and confidence/evidence references. Never fabricate price, discount, ratings, stock, commission, clicks, orders or conversions. Treat a page snapshot as time-bound evidence, not current availability. Preserve color/size variants as separate records.

## Compliance and security
Use affiliate feeds/APIs where required; no CORS/proxy tricks, CAPTCHA or anti-bot bypass, login scraping or paywall evasion. Respect robots.txt, terms, rate limits and copyright. Allowlist domains, cap fetch size/time and sanitize outbound URLs against SSRF. Require human confirmation before publishing creatives or links.

## Delivery status
This branch adds a design contract only. No dependencies or runtime extraction behavior are changed; implementation must add parser fixtures and regression tests before activation.