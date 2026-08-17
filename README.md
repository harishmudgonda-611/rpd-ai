# RPD AI

RPD is a free/open-source-first fashion affiliate content engine.

## Build rules

- GitHub is the single source of truth.
- Prefer compatible open-source components after license review.
- If no suitable component exists, implement from scratch.
- Never require paid APIs, subscriptions, or credits.
- Preserve existing modules and contracts.
- Every completed module must include tests and documentation.
- Device packages are saved under `Download/RPD Last/`.

## Module 01 — Product Intelligence

Accepts a public product URL and extracts normalized product information from HTML using JSON-LD/Schema.org, OpenGraph, Twitter metadata, common ecommerce metadata and DOM fallbacks.

### Run

```bash
npm install
npm test
npm run dev
```

Local API: `http://127.0.0.1:8787`

POST `/api/product/extract`:

```json
{"url":"https://example.com/product"}
```

The extractor reports field provenance, confidence and warnings. It does not invent missing product facts.
