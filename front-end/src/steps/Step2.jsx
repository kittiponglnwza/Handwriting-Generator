import { useState } from "react"
import InfoBox from "../components/InfoBox"
import Tag from "../components/Tag"
import C from "../styles/colors"

function Row({ label, val }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "11px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <span style={{ flex: 1, fontSize: 12, color: C.inkMd }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: C.ink, marginRight: 12 }}>
        {val}
      </span>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: C.sage,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        ✓
      </div>
    </div>
  )
}

export default function Step2({ uploaded, onUpload }) {
  const [loading, setLoading] = useState(false)
  const [drag, setDrag] = useState(false)

  const simulate = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onUpload()
    }, 1100)
  }

  if (loading) {
    return (
      <div
        className="fade-up"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 0",
          gap: 16,
        }}
      >
        <div className="spinner" />
        <p style={{ fontSize: 13, color: C.inkMd }}>กำลังตรวจสอบ dimension...</p>
        <p style={{ fontSize: 11, color: C.inkLt }}>Fail Fast Validation</p>
      </div>
    )
  }

  if (!uploaded) {
    return (
      <div className="fade-up">
        <InfoBox>รองรับเฉพาะ PDF export จาก GoodNotes โดยตรง — ไม่รองรับ scan หรือ screenshot</InfoBox>
        <div
          onClick={simulate}
          onDragOver={e => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => {
            e.preventDefault()
            setDrag(false)
            simulate()
          }}
          style={{
            border: `2px dashed ${drag ? C.ink : C.borderMd}`,
            borderRadius: 16,
            padding: "52px 32px",
            textAlign: "center",
            cursor: "pointer",
            background: drag ? C.bgAccent : C.bgCard,
            transition: "all 0.2s ease",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: C.bgMuted,
              border: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: C.inkMd,
              fontSize: 20,
            }}
          >
            ↑
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: C.ink, marginBottom: 6 }}>
            วาง PDF ที่นี่ หรือคลิกเพื่อเลือกไฟล์
          </p>
          <p style={{ fontSize: 12, color: C.inkLt }}>GoodNotes Export · A5 only · max 10 MB</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up">
      <div
        style={{
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: C.bgMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          📄
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>
            handwriting_template_v1.pdf
          </p>
          <p style={{ fontSize: 11, color: C.inkLt, marginTop: 2 }}>A5 · 1 หน้า · 2.4 MB</p>
        </div>
        <Tag color="sage">ผ่านแล้ว</Tag>
      </div>
      <div
        style={{
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "16px 18px",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: C.inkLt,
            marginBottom: 4,
          }}
        >
          Dimension Validation
        </p>
        <Row label="Page size" val="A5 · 148 × 210 mm" />
        <Row label="Page count" val="1 หน้า" />
        <Row label="Export source" val="GoodNotes 6" />
        <div style={{ display: "flex", alignItems: "center", padding: "11px 0" }}>
          <span style={{ flex: 1, fontSize: 12, color: C.inkMd }}>Perspective distortion</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.ink, marginRight: 12 }}>
            &lt; 0.5%
          </span>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: C.sage,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 10,
            }}
          >
            ✓
          </div>
        </div>
      </div>
    </div>
  )
}
