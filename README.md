# Project Handwriting — โครงสร้างไฟล์ `src/`

```
src/
├── app/                          ← Shell หลัก
│   ├── App.jsx                   ← Root component, step orchestrator
│   ├── AppLayout.jsx             ← Sidebar + Header + Progress bar
│   ├── AppState.js               ← INITIAL_STATE + canOpenStep()
│   ├── routes.js                 ← STEPS definition
│   ├── main.jsx                  ← Entry point
│   └── global.css                ← Keyframes + reset
│
├── features/                     ← 1 folder ต่อ 1 step
│   ├── template/
│   │   └── TemplateStep.jsx      ← Step 1: Generate printable template PDF
│   ├── upload/
│   │   └── UploadStep.jsx        ← Step 2: Upload & parse scanned PDF
│   ├── extraction/
│   │   ├── ExtractionStep.jsx    ← Step 3: Vision glyph extraction ⚠️ rebuilt
│   │   └── ExtractionPanels.jsx  ← Adjuster, GridDebugOverlay, PageDebugOverlay
│   ├── dna/
│   │   └── DnaStep.jsx           ← Step 4: Font DNA / style controls + compile
│   └── preview/
│       └── PreviewStep.jsx       ← Step 5: Real-time preview + export
│
├── engine/                       ← Pure processing — zero React imports
│   ├── vision/
│   │   ├── VisionEngine.js       ← Main orchestrator → processPages()
│   │   ├── glyphPipeline.js      ← extractGlyphsFromCanvas, traceAllGlyphs
│   │   ├── calibration.js        ← buildAutoPageProfiles, findAutoCalibration
│   │   ├── CornerAnchorDetection.js ← L-shape corner marker detection ⚠️ bug
│   │   ├── PerPageCalibration.js
│   │   ├── SmartCropEngine.js
│   │   ├── GlyphNormalizer.js
│   │   ├── GlyphSynthesizer.js
│   │   ├── ConfidenceScoring.js
│   │   ├── ThaiSpecialHandling.js
│   │   ├── StrokeRepair.js
│   │   ├── pdfAnchors.js         ← collectTextAnchors, decodeHgQrCharsPayload
│   │   ├── qr.js                 ← decodeQRFromImageData
│   │   ├── regDots.js            ← buildOrderedCellRectsForPage
│   │   ├── constants.js          ← GRID_GEOMETRY, ZERO_CALIBRATION
│   │   ├── targets.js
│   │   └── utils.js              ← mergeCalibration, clamp
│   ├── font/
│   │   ├── fontBuilder.js        ← compileFontBuffer (opentype.js)
│   │   ├── metrics.js            ← getGlyphClass, isThaiNonSpacing
│   │   ├── thaiFeatures.js       ← GSUB salt/calt + GPOS mark-to-base
│   │   └── exportAdapters/
│   │       └── download.js       ← downloadBuffer, downloadFontZip
│   ├── pipeline/
│   │   ├── PipelineStateMachine.js ← IDLE→CALIBRATING→EXTRACTING→TRACING→DONE
│   │   ├── Telemetry.js
│   │   └── PerformanceGovernor.js
│   └── errors/
│       └── BaseError.js
│
├── shared/                       ← Reusable across features
│   ├── components/
│   │   ├── Btn.jsx
│   │   ├── InfoBox.jsx
│   │   ├── Tag.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── GlyphCard.jsx
│   │   ├── CharCell.jsx
│   │   ├── Group.jsx
│   │   └── Divider.jsx
│   ├── glyph/
│   │   └── glyphVersions.js      ← deformPath, buildVersionedGlyphs
│   └── debug/
│       ├── DebugOverlay.jsx      ← Engine Telemetry overlay
│       ├── QADashboard.jsx       ← Glyph QA dashboard
│       └── ThaiAuditPanel.jsx
│
├── hooks/
│   └── usePipeline.js            ← PipelineStateMachine React hook
│
├── config/
│   ├── pipeline.config.js        ← FEATURES flags, PIPELINE_CONFIG
│   ├── thai.config.js            ← Thai unicode ranges
│   └── export.config.js          ← Font name, MIME types
│
├── styles/
│   ├── colors.js                 ← export default colors (re-export from tokens)
│   └── tokens.js                 ← colors, previewColors, typography, spacing
│
├── lib/
│   ├── analytics.js              ← PostHog wrapper (optional)
│   └── documentSeed.js
│
├── assets/
│   └── hero.png
│
└── tests/
    └── thaiRenderingAudit.js
```



## Data Flow

```
Step 1  TemplateStep      → print & fill by hand
Step 2  UploadStep        → parsedFile { pages[], characters[], status }
Step 3  ExtractionStep    → VisionEngine.processPages() → traceAllGlyphs() → glyphs[]
Step 4  DnaStep           → buildVersionedGlyphs() → compileFontBuffer() → TTF+WOFF
Step 5  PreviewStep       → font face injection → SVG render → PNG/PDF export
```
