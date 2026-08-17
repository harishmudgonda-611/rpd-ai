# RPD Module 03 Contract

## Input

From Module 01:
- `product.colors[]`
- `product.sizes[]`
- `product.variants[]`

## Output

`VariantAnalysis`:
- `variants[]`
- `colors[]`
- `uniqueColorCount`
- `warnings[]`
- `method`

## Rules

1. Marketplace-declared variants outrank visual inference.
2. Never invent an SKU, colour availability, or size.
3. Normalize spelling/aliases but retain the original display name.
4. Duplicate visual evidence must not create duplicate variants.
5. Image analysis can enrich colour evidence but must not silently create a purchasable variant.
6. Every colour carries confidence and provenance.
