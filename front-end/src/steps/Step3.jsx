import { useState } from "react"
import InfoBox from "../components/InfoBox"
import C from "../styles/colors"

const MOCK_ST = [
  "ok",
  "ok",
  "ok",
  "ok",
  "ok",
  "missing",
  "ok",
  "ok",
  "overflow",
  "ok",
  "ok",
  "ok",
  "ok",
  "ok",
  "ok",
  "missing",
]

export default function Step3({ selected }) {
  const chars = [...selected].slice(0, 24)
  const glyphs = chars.map((ch, i) => ({ ch, status: MOCK_ST[i % MOCK_ST.length] }))
  const ok = glyphs.filter(g => g.status === "ok").length
  const missing = glyphs.filter(g => g.status === "missing").length
  const overflow = glyphs.filter(g => g.status === "overflow").length
  const [active, setActive] = useState(null)
  const stStyle = {
    ok: { border: C.sageMd, bg: C.bgCard, textColor: C.sage, label: "OK" },
    missing: { border: C.blushMd, bg: C.blushLt, textColor: C.blush, label: "Missing" },
    overflow: { border: C.amberMd, bg: C.amberLt, textColor: C.amber, label: "Overflow" },
  }

  return (
    <div className="fade-up">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {[
          { label: "OK", val: ok, color: C.sage },
          { label: "Missing", val: missing, color: C.blush },
          { label: "Overflow", val: overflow, color: C.amber },
          { label: "ทั้งหมด", val: glyphs.length, color: C.ink },
        ].map(s => (
          <div
            key={s.label}
            style={{
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "12px 8px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 22,
                fontWeight: 300,
                color: s.color,
                fontFamily: "'DM Serif Display', serif",
              }}
            >
              {s.val}
            </p>
            <p style={{ fontSize: 10, color: C.inkLt, marginTop: 4, letterSpacing: "0.05em" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
      <InfoBox color="amber">MVP ตรวจเฉพาะ Missing และ Overflow — คลิก glyph เพื่อดูรายละเอียด</InfoBox>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(66px,1fr))",
          gap: 8,
        }}
      >
        {glyphs.map(({ ch, status }) => {
          const s = stStyle[status]
          const isActive = active === ch
          return (
            <button
              key={ch}
              className="glyph-card"
              onClick={() => setActive(isActive ? null : ch)}
              style={{
                background: s.bg,
                border: `1.5px solid ${isActive ? C.ink : s.border}`,
                borderRadius: 12,
                padding: "8px 6px",
                textAlign: "center",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  borderRadius: 8,
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  marginBottom: 6,
                  color: C.ink,
                }}
              >
                {status === "missing" ? <span style={{ color: C.border, fontSize: 14 }}>—</span> : ch}
              </div>
              <p style={{ fontSize: 11, fontWeight: 500, color: C.ink }}>{ch}</p>
              <p style={{ fontSize: 10, color: s.textColor, marginTop: 2 }}>{s.label}</p>
            </button>
          )
        })}
      </div>
      {active && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            fontSize: 12,
            color: C.inkMd,
            lineHeight: 1.7,
          }}
        >
          <span style={{ fontWeight: 500, color: C.ink }}>"{active}"</span>{" "}
          — Bounding box: 38 × 42px · Stroke weight: 1.8px avg · Layer: Base consonant
        </div>
      )}
    </div>
  )
}
