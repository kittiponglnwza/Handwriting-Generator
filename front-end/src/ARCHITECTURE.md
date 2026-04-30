# Architecture Guide

## Dependency Rule (enforced — never break this)

```
app  →  features  →  shared  →  engine  →  lib / config
```

- `engine/` — pure JS/TS. No React. No imports from `features/` or `shared/`.
- `features/` — UI per step. May import from `engine/`, `shared/`, `hooks/`, `config/`.
- `features/` — Never import across feature boundaries. Use `shared/` instead.
- `shared/` — UI primitives only. No business logic.

## Folder map

| Folder | Purpose |
|---|---|
| `app/` | Entry point, routing, global layout |
| `app/state/` | `appState.js` (pipeline data) · `authState.js` (auth hook) |
| `features/` | One folder per wizard step |
| `features/dna/` | Step 4: font compilation UI + sub-components |
| `features/preview/` | Step 5: real-time handwriting preview |
| `engine/vision/` | Computer vision pipeline (sub-domains below) |
| `engine/vision/calibration/` | PerPageCalibration, mergeCalibration, constants |
| `engine/vision/detection/` | CornerAnchor, SmartCrop, regDots, QR, pdfAnchors |
| `engine/vision/extraction/` | GlyphPipeline, Normalizer, Synthesizer, ConfidenceScoring, StrokeRepair |
| `engine/vision/thai/` | ThaiSpecialHandling, targets |
| `engine/font/` | fontBuilder, metrics, thaiFeatures |
| `engine/font/exportAdapters/` | download.js (TTF/WOFF/ZIP) |
| `engine/pipeline/` | PipelineStateMachine, PerformanceGovernor, Telemetry |
| `shared/components/` | Btn, InputField, GlyphCard, ErrorBoundary … |
| `shared/glyph/` | glyphVersions.js (deformPath + buildVersionedGlyphs) |
| `shared/types/` | glyph.d.ts, pipeline.d.ts, font.d.ts |
| `hooks/` | Global hooks: usePipeline, useFont, useTheme |
| `config/` | Static config: export, thai, pipeline, auth |
| `styles/` | Design tokens, colors |
| `tests/` | Mirrors src structure — engine · features · shared |

## Path aliases (jsconfig.json)

```js
import { compileFontBuffer } from '@engine/font/fontBuilder'
import { GlyphCard }         from '@shared/components/GlyphCard'
import { usePipeline }       from '@hooks/usePipeline'
import { THAI_CONSONANTS_RANGE } from '@config/thai.config'
```

## Adding a new export format

1. Create `engine/font/exportAdapters/woff2Adapter.js`
2. Export the adapter function
3. Add to `engine/font/exportAdapters/index.js`
4. Add to `config/export.config.js` → `SUPPORTED_FORMATS`
5. Add UI button in `features/dna/ExportButtons.jsx`

## Future: move VisionEngine to Web Worker

```js
// features/extraction/useExtraction.js
const worker = new Worker(new URL('../../engine/vision/VisionEngine.worker.js', import.meta.url))
```

Move heavy processing off main thread — prevents UI jank on large PDFs.
