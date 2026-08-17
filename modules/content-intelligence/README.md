# Module 04 — Content Intelligence

Transforms the normalized RPD product into original Instagram-ready copy and a structured carousel brief.

## Core capabilities

- Multiple creative angles: price, style, occasion, value, trend, curiosity, problem-solution
- Hooks and alternative hooks
- Slide-by-slide copy with semantic roles
- Colour-aware content
- Price/discount-aware copy
- CTA variants
- Caption
- Hashtags and keywords
- Brand voice and locale controls
- Provider-neutral LLM adapter contract
- Deterministic fallback generation when no model/API is available
- No invented product facts

## Open-source assessment

The module keeps its core generator dependency-free. For future LLM enrichment, RPD can use provider-neutral structured-output patterns. Instructor supports structured validated outputs across multiple providers including Ollama and DeepSeek, while Prompture provides an MIT-licensed multi-provider structured extraction layer with a local Ollama option. These are candidates for integration only when they materially improve RPD and their dependencies remain compatible with the free-only/local-first requirement.

## Contract

Input: `ContentRequest`

Output: `ContentPackage`

The output is designed for Module 05 Carousel Generator and can also feed caption/export modules later.

## Tests

Run with the repository's TypeScript test runner:

`npx tsx --test modules/content-intelligence/generator.test.ts`
