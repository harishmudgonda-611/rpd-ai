# Module 02 — AI Fashion Model / Virtual Try-On

## What this module does

- Treats `Download/RPD AI Model` as the default RPD model asset library.
- Recursively scans model images and builds deterministic asset IDs.
- Infers basic pose/category compatibility from filenames.
- Reads PNG/BMP/WebP dimensions where possible.
- Selects the best compatible model asset for a product category and preferred pose.
- Defines a provider-neutral virtual try-on contract.
- Supports a local inference command through `RPD_TRYON_COMMAND`.
- Never fakes a try-on by CSS overlay and never claims an image was generated when no inference provider exists.

## Open-source assessment

Virtual try-on implementations were evaluated. IDM-VTON and CatVTON are strong research references, but their code/checkpoints are CC BY-NC-SA 4.0, which is not compatible with RPD's intended affiliate/commercial use without additional permission. They are therefore **not copied into the RPD codebase**. DCI-VTON has an MIT-licensed repository and is a useful technical reference, but model/checkpoint terms must still be audited before distributing weights. This module therefore keeps the inference layer provider-neutral and avoids importing restricted model code/checkpoints prematurely.

## Current provider contract

A local inference implementation can be connected by setting:

```bash
export RPD_TRYON_COMMAND="python /path/to/rpd_tryon_adapter.py"
```

The command receives a JSON `TryOnRequest` on stdin and must return JSON containing `status`, optional `outputPath`, `warnings`, and `metadata`.

This keeps RPD independent of a particular model and allows a license-compatible local model to be plugged in later.

## Why this is important on the current Android device

The current RPD device is ARM64 with about 7.3 GiB RAM and no NVIDIA GPU. CatVTON's published simplified inference target is about 8 GiB **VRAM** for 1024x768, while IDM-VTON's reference setup also expects a GPU-oriented diffusion environment. Those requirements are not appropriate to silently assume on the phone. Therefore this module does not pretend that full diffusion VTO is available locally today.

## Next integration target

After Module 03 variant intelligence, the orchestrator can call:

`Product -> Variant -> ModelAssetManager -> TryOnEngine -> Carousel`

A license-compatible inference backend can then be installed without changing the RPD contract.
