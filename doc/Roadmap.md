# Project Handwriting — SaaS Execution Roadmap
> Version 1.0 | April 2026 | Senior Product Review

---

## Brutal Priority Order

### #1 — Thai Rendering is Your Core Product
ถ้า Thai text render ผิด คนไม่ซื้อ ไม่มีประโยชน์เลย ทำสิ่งอื่นก่อนไม่ได้

### #2 — Bundle Size = First Impression
964KB main chunk = คน bounce ก่อน app โหลด โดยเฉพาะ mobile Thailand (3G/4G)

### #3 — Crash Proof Before Launch
Error ไม่มี boundary = user เห็น white screen = ไม่กลับมาอีกเลย

### #4 — Font Quality Controls
Roughness / Slant / Neatness sliders = เหตุผลที่คนจ่ายเงิน

### #5 — Pricing + Auth + Landing Page
ไม่มีสิ่งนี้ = ไม่มี revenue ไม่ว่า product จะดีแค่ไหน

### #6 — AI Moat
Smart stroke repair + missing glyph fill = คู่แข่ง copy ไม่ได้ในระยะสั้น

---

## CTO Verdict

**→ Niche SaaS ที่ขยายเป็น Regional SaaS ได้**

เหตุผล:
- Thai handwriting font generation มีคู่แข่ง 0 รายในระดับนี้
- Moat ชัดเจน: Thai-specific pipeline ที่ใช้เวลา 6+ เดือนสร้าง
- Market: นักเรียน, ครู, นักออกแบบ, ธุรกิจ SME ไทย (ตลาดจริง ไม่ใช่ spec)
- Stack ปัจจุบัน (React/Vite, client-side) = ต้นทุน server แทบ 0 ในช่วงแรก
- Revenue path ชัด: 99–199 THB/month × 500 users = 50,000–100,000 THB/month

**ไม่ควรทำ:**
- ไม่ต้อง pivot เป็น startup ทันที
- ไม่ต้องระดม seed funding ก่อนมี MRR จริง
- ไม่ต้อง microservices / backend ก่อนมี 1,000 users

**ทำได้ถ้าต้องการ:**
- Expand ไป Lao / Khmer script (ตลาด SEA)
- License B2B: ขายให้ printing house / publishing / education platforms

---

## Risks — What Can Kill Project Growth

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Thai rendering ยัง broken ใน edge cases | High | Critical | P0.1 — test 50 sentences ก่อน launch ทุกอย่าง |
| User ไม่เข้าใจ workflow 5 steps | High | High | Onboarding tooltip + progress indicator ชัดขึ้น |
| PDF parse ล้มเหลว silent | Medium | High | P0.3 — error boundary + user feedback |
| Bundle ใหญ่ = user drop-off | High | High | P0.2 — lazy load + code split |
| คู่แข่ง clone ใน 3 เดือน | Low | Medium | Ship AI features เร็ว (P3.1, P3.2) |
| Google / Canva เพิ่ม Thai font feature | Low | High | Moat = customization จากลายมือจริง ของตัวเอง |
| Stripe ไม่รองรับ Thai baht ง่าย | Medium | High | ใช้ Omise หรือ PromptPay QR แทน |

---

## Fastest Path to First Revenue

```
Week 1-2:  Fix Thai rendering → Fix bundle → Error boundary
Week 3-4:  Font quality sliders → Live preview
Week 5-6:  Landing page + Pricing page + Waitlist / Pre-order
Week 7-8:  Auth (Google login) + Payment (Omise/Stripe)
Week 9+:   AI features (missing glyph fill) → upsell to Creator plan
```

**Target: ปิด 50 paying users ภายใน 60 วันหลัง launch**

ราคา 99 THB/month × 50 = 4,950 THB/month → prove concept
ราคา 99 THB/month × 500 = 49,500 THB/month → sustainable

---

## Pricing Model (Confirmed)

| Plan | Price | Limits | Key Feature |
|------|-------|--------|-------------|
| Free | 0 THB | 3 fonts/month, PNG only | Try before buy |
| Pro | 99 THB/month | Unlimited fonts, TTF export, HD | Core value |
| Creator | 199 THB/month | Commercial license, batch, brand kit | Power users |

**Payment gateway สำหรับไทย:** Omise (PromptPay + credit card) หรือ Stripe Thailand

---

## Weekly Funnel Metrics (Current Baseline)

```
Step1 → 100%  (ดู template)
Step2 →  73%  (drop 27% — PDF upload friction)
Step3 →  51%  (drop 22% — OCR ใช้เวลา / confused)
Step5 →  20%  (drop 31% — font quality ไม่ดีพอ / crash)
```

**Target after Phase 1:**
```
Step1 → 100%
Step2 →  85%  (+12%)
Step3 →  70%  (+19%)
Step5 →  45%  (+25%)
```

Dashboard ต้องติดตาม:
- Drop-off rate per step
- Error rate per step (จาก Error Boundary logs)
- Export success rate (PNG / PDF / TTF)
- Avg time to complete (Step1 → Step5)
- Paid conversion % (free → pro)