# Engineering Tasks — Concrete Implementation
> ไฟล์ที่ต้องแก้ พร้อม location และ task ชัดเจน

---

## PHASE 1 — Stability

---

### P0.1 Thai Rendering Final Fix

**Files to modify:**
- `src/core/rendering/ThaiEngine.jsx` — main rendering engine
- `src/steps/Step5.jsx` — preview rendering + export
- `src/steps/step4/thaiFeatures.js` — GSUB/GPOS Thai features

**Test sentences (add to `src/tests/thaiRenderingAudit.js`):**
```js
export const THAI_TEST_SENTENCES = [
  // Tone marks (วรรณยุกต์)
  "ฉันไปตลาดมา",
  "น้ำแข็งใส",
  "เก้าอี้ไม้",
  "ผู้ใหญ่ใจดี",
  "ไก่จิกเด็กตาย",

  // Above vowels (สระบน)
  "กิน ดื่ม นอน",
  "ชื่อเสียงเรียงนาม",
  "เขียนหนังสือ",

  // Below vowels (สระล่าง)
  "ครุฑ",
  "ฤดูใบไม้ร่วง",

  // Long compounds
  "กรุงเทพมหานคร",
  "สวัสดีครับ สบายดีไหม",
  "ประเทศไทยมีอากาศร้อน",

  // Mixed Thai-English
  "Hello สวัสดี World",
  "Font ลายมือ Thai",

  // Numbers + Thai
  "วันที่ 25 เมษายน 2568",

  // Rare consonants
  "ฆ่า ฌาน ฎีกา ฏิ ฐาน ฑูต ฒา ณ ศาล ษา ฬ",

  // Edge cases
  "แมวกินปลา",     // ไม้หน้า + สระหลัง
  "โต๊ะเก้าอี้",   // ไม้โอ + ไม้ตรี
  "เที่ยวบิน",     // cluster complex
  "สุขภาพดี",
  "ขอบคุณมากครับ",

  // Multiple lines
  `บรรทัดที่หนึ่ง
บรรทัดที่สอง
บรรทัดที่สาม`,
]
```

**Audit checklist (เพิ่มใน QADashboard.jsx หรือ console log):**
```js
// src/tests/thaiRenderingAudit.js
export function auditThaiRendering(renderFn) {
  const results = []
  for (const sentence of THAI_TEST_SENTENCES) {
    const output = renderFn(sentence)
    results.push({
      input: sentence,
      hasFloatingMark: detectFloatingMark(output),  // tone mark y-pos ผิด
      hasWrongSpacing: detectWrongSpacing(output),   // space ใหญ่เกิน
      hasBrokenLineHeight: detectLineHeightIssue(output),
    })
  }
  return results
}
```

---

### P0.2 Bundle Size Reduction

**Files to modify:**
- `src/App.jsx` — เพิ่ม lazy imports
- `src/steps/Step4.jsx` — dynamic import opentype.js
- `src/steps/Step5.jsx` — dynamic import html2canvas
- `vite.config.js` — เพิ่ม manual chunk config

**Task 1: Lazy load Steps 4 & 5 ใน App.jsx**
```jsx
// src/App.jsx
// แก้จาก:
import Step4 from "./steps/Step4.jsx"
import Step5 from "./steps/Step5"

// เป็น:
import { lazy, Suspense } from "react"
const Step4 = lazy(() => import("./steps/Step4.jsx"))
const Step5 = lazy(() => import("./steps/Step5"))

// ครอบด้วย Suspense ใน render:
<Suspense fallback={<div className="spinner" />}>
  {step === 4 && <Step4 ... />}
</Suspense>
```

**Task 2: Dynamic import pdfjs ใน Step2.jsx**
```js
// src/steps/Step2.jsx
// แก้จาก: import * as pdfjsLib from 'pdfjs-dist'
// เป็น:
const pdfjsLib = await import('pdfjs-dist')
```

**Task 3: vite.config.js — manual chunks**
```js
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'pdf':      ['pdfjs-dist'],
        'font':     ['opentype.js'],
        'zip':      ['jszip'],
        'canvas':   ['html2canvas'],
        'react':    ['react', 'react-dom'],
      }
    }
  }
}
```

**Task 4: วัดผล**
```bash
npm run build -- --report
# หรือ
npx vite-bundle-visualizer
```

**Target:** main.js < 350KB, pdfjs chunk load เฉพาะ Step2

---

### P0.3 Crash Proof

**Files to create:**
- `src/components/ErrorBoundary.jsx` — NEW FILE

**Files to modify:**
- `src/App.jsx` — ครอบ Step components ด้วย ErrorBoundary
- `src/steps/Step2.jsx` — corrupted PDF handling
- `src/steps/Step3.jsx` — OCR timeout + error state
- `src/engine/PipelineStateMachine.js` — error state propagation

**Task 1: สร้าง ErrorBoundary component**
```jsx
// src/components/ErrorBoundary.jsx  (NEW FILE)
import { Component } from "react"

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // TODO Phase 2: ส่ง error log ไป PostHog / Sentry
    console.error("[ErrorBoundary]", error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            เกิดข้อผิดพลาด
          </p>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
            {this.state.error.message}
          </p>
          <button onClick={() => this.setState({ error: null })}>
            ลองใหม่
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

**Task 2: ครอบใน App.jsx**
```jsx
// src/App.jsx — ใน content object
3: (
  <ErrorBoundary key={`step3-${appState.parsedFile?.file?.name}`}>
    <Step3 parsedFile={appState.parsedFile} onGlyphsUpdate={handleGlyphsUpdate} />
  </ErrorBoundary>
),
```

**Task 3: Corrupted PDF guard ใน Step2.jsx**
```js
// src/steps/Step2.jsx — ใน parse function
try {
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
} catch (err) {
  if (err.name === 'InvalidPDFException') {
    setError("ไฟล์ PDF เสียหายหรือไม่ถูกต้อง กรุณาลอง export PDF ใหม่")
    return
  }
  setError("ไม่สามารถอ่าน PDF ได้: " + err.message)
}
```

---

## PHASE 2 — Premium Feel

---

### P1.1 Font Quality Controls

**Files to modify:**
- `src/steps/Step4.jsx` — เพิ่ม slider UI
- `src/steps/Step5.jsx` — apply style params ตอน render
- `src/lib/glyphVersions.js` — เพิ่ม style params ใน `deformPath()`
- `src/App.jsx` — เพิ่ม `fontStyle` ใน `appState`

**เพิ่มใน INITIAL_STATE (App.jsx):**
```js
const INITIAL_STATE = {
  parsedFile: null,
  glyphResult: null,
  versionedGlyphs: [],
  ttfBuffer: null,
  fontStyle: {          // NEW
    roughness:   30,    // 0-100
    neatness:    70,    // 0-100
    slant:        0,    // -30 to +30 degrees
    boldness:   100,    // 70-150 %
    randomness:  40,    // 0-100
  },
}
```

**Slider component ใน Step4.jsx sidebar:**
```jsx
// src/steps/Step4.jsx
const SLIDERS = [
  { key: "roughness",  label: "ความสั่น",   min: 0,   max: 100, unit: "" },
  { key: "neatness",   label: "ความเรียบ",  min: 0,   max: 100, unit: "" },
  { key: "slant",      label: "เอียง",      min: -30, max: 30,  unit: "°" },
  { key: "boldness",   label: "น้ำหนัก",    min: 70,  max: 150, unit: "%" },
  { key: "randomness", label: "ความสุ่ม",   min: 0,   max: 100, unit: "" },
]
```

---

### P1.3 Better Export

**Files to modify:**
- `src/steps/Step5.jsx` — export buttons + handlers
- `src/steps/step4/download.js` — เพิ่ม SVG export function

**Export functions ที่ต้องมี:**
```js
// src/steps/step4/download.js
export async function exportPNG(canvasEl, filename)   // มีแล้ว — verify
export async function exportPDF(canvasEl, filename)   // ใช้ jsPDF
export async function exportSVG(glyphs, filename)     // NEW — export raw paths
export async function exportTTF(ttfBuffer, filename)  // มีแล้ว — verify
```

---

## PHASE 3 — Monetization

---

### P2.1 Auth System

**Files to create:**
- `src/lib/auth.js` — NEW: Firebase/Supabase auth wrapper
- `src/components/AuthModal.jsx` — NEW: Google login modal
- `src/hooks/useAuth.js` — NEW: auth state hook

**Tech choice:** Supabase (free tier เพียงพอ + PostgreSQL พร้อม scale)

```bash
npm install @supabase/supabase-js
```

---

### P2.2 Payment

**Files to create:**
- `src/lib/payment.js` — NEW: Omise/Stripe wrapper
- `src/components/PricingModal.jsx` — NEW: upgrade CTA

**Omise (แนะนำสำหรับไทย):**
```bash
npm install omise  # หรือ load script tag
```

---

### P2.3 Analytics

**Files to create:**
- `src/lib/analytics.js` — NEW: PostHog/Plausible wrapper

```js
// src/lib/analytics.js (NEW FILE)
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY

export function trackEvent(name, props = {}) {
  if (!window.posthog) return
  window.posthog.capture(name, props)
}

// Events to track:
// trackEvent('step_entered', { step: 2 })
// trackEvent('pdf_uploaded', { pages: 3, size_kb: 450 })
// trackEvent('ocr_completed', { glyph_count: 72, duration_ms: 3200 })
// trackEvent('export_success', { format: 'TTF' })
// trackEvent('export_failed', { format: 'PNG', error: 'html2canvas timeout' })
// trackEvent('payment_started', { plan: 'pro' })
// trackEvent('payment_success', { plan: 'pro', amount_thb: 99 })
```

---

## PHASE 4 — AI Moat

---

### P3.1 Smart Stroke Repair

**Files to create:**
- `src/core/vision/StrokeRepair.js` — NEW

**Algorithm:**
```js
// src/core/vision/StrokeRepair.js (NEW FILE)
export function repairBrokenStrokes(svgPath, threshold = 5) {
  // 1. Parse path commands (M, L, C, Z)
  // 2. Find gaps > threshold px between subpaths
  // 3. Auto-connect with smooth cubic bezier
  // 4. Return repaired path + { repaired: boolean, gapsFixed: number }
}
```

---

### P3.2 Auto Missing Character Fill

**Files to create:**
- `src/core/vision/GlyphSynthesizer.js` — NEW

**Thai rare glyphs ที่มักขาดหาย:**
```js
// src/core/vision/GlyphSynthesizer.js (NEW FILE)
export const RARE_THAI_GLYPHS = [
  'ฆ', 'ฌ', 'ฎ', 'ฏ', 'ฐ', 'ฑ', 'ฒ', 'ณ',
  'ศ', 'ษ', 'ฬ', 'ฦ', 'ฤ', 'ๆ', 'ฯ',
]

export function synthesizeMissingGlyphs(existingGlyphs, targetChars) {
  // 1. วิเคราะห์ style จาก existingGlyphs (stroke width, curvature, slant)
  // 2. หา base glyph ที่ใกล้เคียงที่สุด (shape similarity)
  // 3. Transform base → target character shape
  // 4. Apply style parameters
  // return: synthetic glyph SVG paths
}
```

---

## File Change Summary

| File | Action | Phase |
|------|--------|-------|
| `src/components/ErrorBoundary.jsx` | **CREATE** | P0.3 |
| `src/tests/thaiRenderingAudit.js` | **CREATE** | P0.1 |
| `src/lib/analytics.js` | **CREATE** | P2.3 |
| `src/lib/auth.js` | **CREATE** | P2.1 |
| `src/hooks/useAuth.js` | **CREATE** | P2.1 |
| `src/components/AuthModal.jsx` | **CREATE** | P2.1 |
| `src/components/PricingModal.jsx` | **CREATE** | P2.2 |
| `src/lib/payment.js` | **CREATE** | P2.2 |
| `src/core/vision/StrokeRepair.js` | **CREATE** | P3.1 |
| `src/core/vision/GlyphSynthesizer.js` | **CREATE** | P3.2 |
| `src/App.jsx` | **MODIFY** — lazy imports, fontStyle state, ErrorBoundary | P0.2, P0.3, P1.1 |
| `src/steps/Step2.jsx` | **MODIFY** — corrupted PDF error handling | P0.3 |
| `src/steps/Step3.jsx` | **MODIFY** — OCR timeout + loading state | P0.3 |
| `src/steps/Step4.jsx` | **MODIFY** — slider UI, dynamic opentype import | P0.2, P1.1 |
| `src/steps/Step5.jsx` | **MODIFY** — export functions, apply fontStyle | P1.1, P1.3 |
| `src/steps/step4/download.js` | **MODIFY** — เพิ่ม exportSVG, exportPDF | P1.3 |
| `src/lib/glyphVersions.js` | **MODIFY** — รับ fontStyle params ใน deformPath | P1.1 |
| `src/core/rendering/ThaiEngine.jsx` | **MODIFY** — fix tone mark positioning | P0.1 |
| `vite.config.js` | **MODIFY** — manual chunks | P0.2 |

---

## Do NOT Touch (Yet)

- `src/engine/PipelineStateMachine.js` — ซับซ้อน refactor risk สูง
- `src/core/vision/VisionEngine.js` — stable, อย่าแตะจนกว่าจะต้องการ
- `src/lib/step3/glyphPipeline.js` — core OCR logic ทำงานได้แล้ว
- `src/workers/` — worker architecture ใช้ได้แล้ว