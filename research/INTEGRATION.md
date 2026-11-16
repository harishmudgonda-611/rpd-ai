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
The default branch already contains a Cheerio-based product extractor and tests for JSON-LD, Open Graph, price/currency, colors, images, ratings, and access-blocked pages. This PR documents the appropriate optional adapter boundaries and provenance requirements; it does not replace the existing extractor or add a new crawler. The existing extractor must remain the source of product facts, with explicit evidence and warnings.

## Implemented in this branch
- The existing HTTP product extractor now checks the marketplace `robots.txt` policy before requesting a product page. A policy fetch error, redirect, access denial or non-recoverable status fails closed; `404`/`410` means no published robots policy was found.
- Product-page requests have a 15-second abort timeout and a 2 MB streamed response cap. Robots files have an independent 8-second timeout and 256 KB cap. Robots policy is checked again for each redirect destination.
- Only HTML/XHTML product responses are parsed. Redirects remain manual and are revalidated against supported marketplaces and public DNS addresses.
- `src/robots.ts` implements a small, tested Allow/Disallow evaluator for common user-agent, prefix and wildcard rules. It is intentionally conservative and is not a substitute for full RFC 9309 conformance.
- Existing product extraction, pricing qualification and downstream workflows remain unchanged. No browser automation, login, CAPTCHA handling, anti-bot bypass, paid API or order execution was added.

## Validation status
The new robots policy unit tests and the existing extractor regression suite must pass in the PR's GitHub Actions run before merge. Marketplace behavior can differ by host; blocked or ambiguous policy responses are treated as a stop condition, not something to work around.
