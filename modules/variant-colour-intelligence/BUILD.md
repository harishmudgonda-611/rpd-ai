# Build verification

Run from repository root:

```bash
npm install
npx tsx --test modules/variant-colour-intelligence/analyzer.test.ts
```

The module core is deterministic and requires no paid service. The image-analysis path is an adapter point; it does not claim a colour is an available marketplace variant unless the source data supports that claim.
