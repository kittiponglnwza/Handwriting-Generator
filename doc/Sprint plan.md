# 30-Day Sprint Plan — Project Handwriting
> Week-by-week execution. ทำตามลำดับนี้เท่านั้น ห้าม skip

---

## Week 1 — Stability Core (P0)

**Goal:** ทำให้ app ไม่ crash และ Thai rendering ใช้งานได้จริง

### Day 1–2: Thai Rendering Audit
- รัน test suite 50 Thai sentences (ดู `ENGINEERING_TASKS.md` สำหรับ list เต็ม)
- วัด: floating tone marks, spacing, line-height, export vs preview match
- สร้าง `src/tests/thaiRenderingAudit.js` — automated visual regression

### Day 3–4: Error Boundary + Crash Proof
- เพิ่ม `<ErrorBoundary>` ครอบทุก Step component
- เพิ่ม fallback UI: "เกิดข้อผิดพลาด กรุณาลอง upload PDF ใหม่"
- Handle corrupted PDF: ถ้า Step2 parse fail → แสดง error message ชัดเจน
- Loading states ทุก async operation (Step3 OCR โดยเฉพาะ)

### Day 5–7: Bundle Size Reduction
- Lazy load Step4 และ Step5 ด้วย `React.lazy()` + `Suspense`
- Dynamic import: `pdfjs-dist`, `jszip`, `opentype.js` → load เฉพาะเมื่อใช้
- Route-level code splitting
- Target: main chunk < 350KB (จาก 964KB)
- วัดด้วย `vite-bundle-visualizer` ก่อนและหลัง

**Deliverable Week 1:**
- [ ] Thai rendering: 0 floating tone marks ใน 50 test sentences
- [ ] Error Boundary ทุก step
- [ ] Bundle < 350KB
- [ ] No white screen crash

---

## Week 2 — Premium Feel (P1)

**Goal:** ให้ user รู้สึกว่า software นี้ quality สูง

### Day 8–10: Font Quality Controls
- เพิ่ม sliders ใน Step4 / Step5 sidebar:
  - Roughness (0–100) — ความสั่นของเส้น
  - Neatness (0–100) — ความเรียบร้อย
  - Slant (-30° → +30°) — เอียงซ้าย/ขวา
  - Boldness (70–150%) — น้ำหนักเส้น
  - Randomness (0–100) — ความสุ่มของ variation
- ใช้ `deformPath()` ที่มีอยู่แล้วใน `lib/glyphVersions.js`
- Store ค่า slider ใน `appState` (ไม่ใช่ local state)

### Day 11–12: Live Preview Instant
- Preview update ต้องเกิด < 100ms หลัง slider change
- ใช้ `useCallback` + `useMemo` + debounce 50ms
- ตรวจสอบ: ไม่มี re-render ที่ไม่จำเป็น (React DevTools profiler)

### Day 13–14: Better Export Options
- PNG export: แก้ html2canvas fallback ให้ทำงานได้เสมอ
- PDF export: ใช้ jsPDF wrap canvas output
- SVG export: export glyph paths ดิบ (ไม่ใช่ screenshot)
- TTF: ตรวจสอบ `fontBuilder.js` ว่า compile สำเร็จสม่ำเสมอ

**Deliverable Week 2:**
- [ ] Sliders 5 ตัวทำงานได้
- [ ] Preview update < 100ms
- [ ] Export ทำงานได้ทุก format (PNG, PDF, TTF, SVG)

---

## Week 3 — Monetization Foundation (P2)

**Goal:** เตรียม infrastructure สำหรับเก็บเงิน

### Day 15–17: Landing Page
- สร้าง `/landing` route แยกจาก app
- ส่วน: Hero, Before/After, Live Demo, Features, Pricing, CTA
- Before/After: ภาพถ่ายลายมือ → font ที่ generate ออกมา (ใช้ example จริง)
- Live Demo: embed Step5 preview แบบ read-only ให้คนเล่นก่อน signup
- Pricing cards: Free / Pro / Creator
- CTA: "เริ่มใช้ฟรี" → signup form

### Day 18–19: Auth System
- Google OAuth (Firebase Auth หรือ Supabase Auth)
- User profile: save font settings, project history
- Free tier: จำกัด 3 exports/month (track ใน localStorage ก่อน → db ทีหลัง)

### Day 20–21: Payment Integration
- Omise (แนะนำ — รองรับ PromptPay + บัตรเครดิตไทย)
- Checkout flow: Free → Pro upgrade
- Webhook: update user tier หลัง payment success

**Deliverable Week 3:**
- [ ] Landing page live (Vercel/Netlify)
- [ ] Google login ทำงานได้
- [ ] Payment flow end-to-end (test mode)

---

## Week 4 — AI Moat Foundation (P3)

**Goal:** เริ่มสร้าง feature ที่ copy ยาก

### Day 22–24: Missing Glyph Auto-Fill
- Detect glyphs ที่ขาดหายใน set: ฆ ฌ ฎ ฏ ฐ ฑ ฒ ณ ศ ษ ฬ etc.
- ใช้ style parameters จาก glyphs ที่มีอยู่ → generate ตัวที่ขาด
- UI: แสดง "missing glyphs" section ใน Step4 พร้อม preview ที่ AI fill

### Day 25–26: Smart Stroke Repair (basic)
- Detect เส้นที่ขาด (gap > threshold) ใน SVG path
- Auto-connect gap ที่เล็กพอ (< 5px)
- UI: show "repaired" indicator บน glyph card

### Day 27–28: Analytics Dashboard (internal)
- Integrate PostHog (free tier) หรือ Plausible
- Track events: `step_entered`, `export_success`, `export_fail`, `payment_started`
- Build funnel view ใน PostHog dashboard

### Day 29–30: Buffer + Launch Prep
- Bug fixes จาก Week 1–3 ที่ยังค้างอยู่
- SEO: meta tags, OG image, sitemap.xml
- Social proof: screenshot testimonial (ถามเพื่อนที่ test)
- Soft launch: โพสต์ใน Facebook group "นักออกแบบไทย", Twitter/X

**Deliverable Week 4:**
- [ ] Missing glyph auto-fill ทำงานได้ใน Pro tier
- [ ] Analytics tracking ทุก funnel event
- [ ] Ready to launch