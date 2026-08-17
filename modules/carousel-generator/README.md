# Module 05 — Carousel Generator

RPD's visual Instagram carousel renderer.

## Open-source-first basis

Open Carrusel is an MIT-licensed, local-first Instagram carousel builder that renders HTML/CSS to exact Instagram-sized PNGs; its architecture is a strong reference for RPD. RPD does not copy its application wholesale. The renderer here uses an RPD-owned slide contract and a lightweight HTML/CSS document renderer so the engine can later plug into Puppeteer/Playwright or another local renderer.

## RPD requirements

- Portrait Instagram carousel: 1080×1350 (4:5)
- 4–8 slides
- 4–5 RPD templates
- Templates are original RPD designs; user references are inspiration only
- Default RPD AI fashion model is an asset input, not a hardcoded remote URL
- Product colours can produce one carousel containing colour variants
- Content comes from Module 04
- No paid rendering API
- Never invent product information

## Output

A `CarouselDocument` contains ordered slides, template metadata, dimensions, and export targets. The HTML renderer produces deterministic HTML/CSS that can be passed to a local browser renderer for PNG export.

## Rendering

The core renderer intentionally has no cloud dependency. Browser export is an adapter so Termux can use an installed Chromium/Playwright/Puppeteer runtime later.
