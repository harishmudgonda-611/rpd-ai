# Module 03 — Variant & Colour Intelligence

## Purpose
Normalize product variants and colour names so RPD can generate one reliable visual/content path per real product colour.

## Current capabilities

- Explicit variant normalization
- Explicit colour-list normalization
- Fashion colour alias handling (for example Wine/Burgundy → Maroon)
- Variant deduplication
- Stable variant IDs
- Colour evidence with source and confidence
- Visual colour evidence merge point
- No invented variants

## Open-source assessment

Relevant open-source references were evaluated. Algolia's `color-extractor` is specifically designed for dominant colours of ecommerce fashion images and uses preprocessing/background/skin filtering plus clustering; its repository is no longer maintained, so RPD treats it as a reference rather than a core dependency. Color Thief is an actively documented MIT-licensed option for dominant palettes in browser/Node environments and is a candidate for the image-analysis adapter. The RPD core remains provider-neutral so a better maintained local CV implementation can replace it later.

The engine is deliberately split into two evidence paths:

1. **Explicit product data** — highest confidence; source of truth when the marketplace declares variants.
2. **Image analysis** — secondary evidence used to validate/enrich colour when product metadata is incomplete.

RPD must never convert an inferred visual colour into an officially available product variant without an explicit source or a later validation step.

## Contract

`analyzeVariants(variants, colors)` returns `VariantAnalysis`.

`mergeImageColorEvidence(result, imageColors)` enriches known colours without creating unsupported SKUs.

## Next integration

Module 01's normalized product output should feed this module's `variants` and `colors`. Module 02's model/try-on output will consume individual `RPDVariant` records to produce colour-specific fashion visuals.
