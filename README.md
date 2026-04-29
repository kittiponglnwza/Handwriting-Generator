# Handwriting Font Generator

**PDF → Vision → TTF** — แปลงลายมือจากกระดาษสแกนเป็นฟอนต์ .ttf / .woff ที่ใช้งานได้จริง

---

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| UI        | React + Vite |
| PDF Parse | pdfjs-dist |
| Font Build | opentype.js |
| Vision    | Canvas API (browser) |
| QR Decode | jsQR (CDN) |
| Analytics | PostHog (optional) |

---

## Project Structure

```
src/
├── app/                    # Shell — routing, layout, global state
│   ├── App.jsx             # Root component, step orchestrator
│   ├── AppLayout.jsx       # Sidebar + Header + Progress bar
│   ├── AppState.js         # INITIAL_STATE + canOpenStep()
│   ├── routes.js           # STEPS definition
│   ├── main.jsx            # Entry point
│   └── global.css          # Keyframes + reset
│
├── features/               # One folder per pipeline step
│   ├── template/           # Step 1 — Generate printable template PDF
│   ├── upload/             # Step 2 — Upload & parse scanned PDF
│   ├── extraction/         # Step 3 — Vision glyph extraction
│   ├── dna/                # Step 4 — Font DNA / style controls + compile
│   └── preview/            # Step 5 — Real-time preview + export
│
├── engine/                 # Pure processing — zero React imports
│   ├── pipeline/           # State machine, telemetry, perf governor
│   ├── vision/             # Computer vision pipeline (calibration → trace)
│   ├── font/               # OpenType compilation (fontBuilder → metrics → GSUB/GPOS)
│   │   └── exportAdapters/ # TTF / WOFF / SVG / PDF download helpers
│   └── errors/             # Typed error classes
│
├── shared/                 # Reusable across features
│   ├── components/         # UI atoms (Btn, Tag, InfoBox, GlyphCard …)
│   ├── glyph/              # Shared glyph utilities (glyphVersions, deformPath)
│   └── debug/              # Dev-only panels (QADashboard, ThaiAuditPanel)
│
├── hooks/                  # Global React hooks (usePipeline)
├── config/                 # Feature flags + pipeline + thai + export config
├── styles/                 # Design tokens (colors, spacing, typography)
├── lib/                    # Third-party wrappers (analytics, documentSeed)
├── assets/                 # Static images
└── tests/                  # Audit scripts
```

---

## 5-Step Pipeline

```
Step 1  Generate Template PDF   → print & fill by hand
Step 2  Upload Scanned PDF      → extract QR + text anchors + reg-dots
Step 3  Vision Extraction       → VisionEngine → SVG paths per glyph
Step 4  DNA / Font Build        → fontBuilder → TTF + WOFF + GSUB/GPOS
Step 5  Preview + Export        → font / SVG render → PNG download
```

---

## Getting Started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in `VITE_POSTHOG_KEY` if you want analytics.

---

## OpenType Features

| Feature | Table | Description |
|---------|-------|-------------|
| `salt`  | GSUB  | Stylistic Alternates — default → alt1 |
| `calt`  | GSUB  | Contextual Alternates — rotate mod 3 per repeated glyph |
| `mark`  | GPOS  | Thai mark-to-base positioning |

---

## Architecture Notes

- **`engine/`** has zero React dependencies — safe to move to Web Workers later.
- **`features/`** own their UI + local hooks; deleting a feature = deleting one folder.
- **`shared/glyph/glyphVersions.js`** is the single source for `deformPath` (used by both Step 4 and Step 5 — previously caused a hidden cross-domain dependency).
- Feature flags live in `config/pipeline.config.js` — flip `enableWoff2Export` to add WOFF2 without touching fontBuilder.
