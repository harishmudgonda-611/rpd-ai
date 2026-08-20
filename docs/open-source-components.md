# Open-Source Component Architecture & Candidate Matrix

## Candidate Matrix

| Domain | Selected Open-Source Candidate | Integration Strategy | Fallback / Self-Contained Path |
|---|---|---|---|
| Background Removal | `briaai/RMBG-1.4` (ONNX) | Local ONNX runtime worker process | Canvas threshold mask fallback |
| Virtual Try-On | `IDM-VTON` / `OOTDiffusion` | Provider-neutral REST adapter | Mannequin backdrop synthesizer |
| Server Canvas Rendering | `@napi-rs/canvas` | 2D Context high-density SVG/PNG export | HTML5 SVG DOM string rendering |
| PDF Document Generation | `pdfkit` / `jspdf` | Stream-based multi-page vector PDF export | SVG Blob assembly |
| Batch Extractor | `cheerio` + `undici` | Async concurrent fetcher | Schema.org JSON-LD DOM parser |

## Security & SSRF Safeguards
- All outbound URL requests are validated against private IP blacklists (`127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
- File uploads and ZIP archives sanitize file paths to prevent directory traversal (`..` sanitization).
