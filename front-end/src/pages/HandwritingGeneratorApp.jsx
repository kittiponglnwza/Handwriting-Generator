import { useState } from "react"

const C = {
  bg: "#F7F5F0",
  bgCard: "#FFFFFF",
  bgMuted: "#F0EDE6",
  bgAccent: "#EDEAE2",
  border: "#E5E0D5",
  borderMd: "#D4CEBC",
  ink: "#2C2416",
  inkMd: "#6B6047",
  inkLt: "#9E9278",
  sage: "#4A7C6F",
  sageLt: "#E6F0EE",
  sageMd: "#C5DDD8",
  blush: "#C0503A",
  blushLt: "#F8EDEA",
  blushMd: "#EDCDC7",
  amber: "#A0702A",
  amberLt: "#F8F0E3",
  amberMd: "#E8D4A8",
}

const THAI_CONSONANTS = "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ".split("")
const DIGITS = "0123456789".split("")
const ENG_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
const ENG_LOWER = "abcdefghijklmnopqrstuvwxyz".split("")

const DNA_PARAMS = [
  { name: "Spacing tendency", dist: "Normal  σ = 0.05em", value: 62 },
  { name: "Baseline offset", dist: "Normal  μ = 0  σ = 1.5px", value: 45 },
  { name: "Rotation tendency", dist: "Uniform  ±1.5°", value: 50 },
  { name: "Scale variation", dist: "Normal  σ = 0.03", value: 38 },
]

const SEEDS = ["0x7f3a2c91", "0x3b9e12f4", "0xa1c8e302", "0x55d0f7ab"]
const MOCK_ST = ["ok", "ok", "ok", "ok", "ok", "missing", "ok", "ok", "overflow", "ok", "ok", "ok", "ok", "ok", "ok", "missing"]
const STEPS = [
  { id: 1, label: "เลือกตัวอักษร", icon: "01" },
  { id: 2, label: "Upload PDF", icon: "02" },
  { id: 3, label: "ตรวจ Glyphs", icon: "03" },
  { id: 4, label: "DNA Profile", icon: "04" },
  { id: 5, label: "Preview", icon: "05" },
]

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;background:#F7F5F0}
    .hw-app{background:#F7F5F0;min-height:100vh}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .fade-up{animation:fadeUp .35s ease forwards}
    .char-cell{transition:all .12s cubic-bezier(.4,0,.2,1)}
    .char-cell:active{transform:scale(.88)}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
    .cursor{display:inline-block;width:1.5px;height:1.1em;background:#2C2416;vertical-align:middle;margin-left:1px;animation:blink 1.1s step-start infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .spinner{width:28px;height:28px;border:2px solid #E5E0D5;border-top-color:#2C2416;border-radius:50%;animation:spin .7s linear infinite}
    @keyframes fillBar{from{width:0%}}
    .bar-fill{animation:fillBar .6s ease forwards}
    .glyph-card{transition:transform .15s ease,box-shadow .15s ease}
    .glyph-card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(44,36,22,.08)}
    .step-dot{transition:all .2s ease}
  `}</style>
)

const toneStyles = {
  neutral: { background: C.bgMuted, color: C.inkMd, border: C.border },
  sage: { background: C.sageLt, color: C.sage, border: C.sageMd },
  blush: { background: C.blushLt, color: C.blush, border: C.blushMd },
  amber: { background: C.amberLt, color: C.amber, border: C.amberMd },
  draft: { background: C.amberLt, color: C.amber, border: C.amberMd },
}

const Tag = ({ children, color = "neutral" }) => {
  const s = toneStyles[color]
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.04em",
        background: s.background,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {children}
    </span>
  )
}

const Btn = ({ children, onClick, disabled, variant = "ghost", size = "md" }) => {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    border: "none",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s ease",
    fontWeight: 400,
  }
  const sizes = {
    sm: { fontSize: 12, padding: "5px 14px", borderRadius: 8 },
    md: { fontSize: 13, padding: "8px 18px", borderRadius: 10 },
  }
  const variants = {
    primary: { background: C.ink, color: "#FBF9F5", border: "none" },
    ghost: { background: "transparent", color: C.inkMd, border: `1px solid ${C.border}` },
    sage: { background: C.sage, color: "#fff", border: "none" },
  }
  return (
    <button onClick={!disabled ? onClick : undefined} style={{ ...base, ...sizes[size], ...variants[variant] }}>
      {children}
    </button>
  )
}

const Divider = () => <div style={{ height: 1, background: C.border, margin: "20px 0" }} />

const InfoBox = ({ children, color = "neutral" }) => {
  const s = toneStyles[color]
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        marginBottom: 20,
        background: s.background,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 12,
        lineHeight: 1.6,
        display: "flex",
        gap: 8,
      }}
    >
      <span style={{ marginTop: 1, fontWeight: 600 }}>ℹ</span>
      <span>{children}</span>
    </div>
  )
}

const CharCell = ({ ch, selected, onToggle }) => {
  const sel = selected.has(ch)
  return (
    <button
      className="char-cell"
      onClick={() => onToggle(ch)}
      style={{
        width: "100%",
        aspectRatio: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        fontFamily: "inherit",
        borderRadius: 10,
        border: `1.5px solid ${sel ? C.ink : C.border}`,
        background: sel ? C.ink : C.bgCard,
        color: sel ? "#FBF9F5" : C.ink,
        cursor: "pointer",
      }}
    >
      {ch}
    </button>
  )
}

const Group = ({ label, chars, selected, onToggle }) => (
  <div style={{ marginBottom: 24 }}>
    <p
      style={{
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: C.inkLt,
        marginBottom: 10,
      }}
    >
      {label}
    </p>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(38px, 1fr))",
        gap: 6,
      }}
    >
      {chars.map(ch => (
        <CharCell key={ch} ch={ch} selected={selected} onToggle={onToggle} />
      ))}
    </div>
  </div>
)

const Row = ({ label, val }) => (
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

const Step1 = ({ selected, onToggle }) => {
  return (
    <div className="fade-up">
      <InfoBox color="amber">เลือกเฉพาะตัวอักษรที่ต้องการ — Template จะสร้างเฉพาะตัวที่เลือก</InfoBox>
      <Group label="พยัญชนะไทย" chars={THAI_CONSONANTS} selected={selected} onToggle={onToggle} />
      <Group label="ตัวเลข" chars={DIGITS} selected={selected} onToggle={onToggle} />
      <Group label="English A–Z" chars={ENG_UPPER} selected={selected} onToggle={onToggle} />
      <Group label="English a–z" chars={ENG_LOWER} selected={selected} onToggle={onToggle} />
    </div>
  )
}

const Step2 = ({ uploaded, onUpload }) => {
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
      <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 16 }}>
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
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.bgMuted, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.inkMd, fontSize: 20 }}>↑</div>
          <p style={{ fontSize: 14, fontWeight: 500, color: C.ink, marginBottom: 6 }}>วาง PDF ที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
          <p style={{ fontSize: 12, color: C.inkLt }}>GoodNotes Export · A5 only · max 10 MB</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up">
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: C.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📄</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>handwriting_template_v1.pdf</p>
          <p style={{ fontSize: 11, color: C.inkLt, marginTop: 2 }}>A5 · 1 หน้า · 2.4 MB</p>
        </div>
        <Tag color="sage">ผ่านแล้ว</Tag>
      </div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.inkLt, marginBottom: 4 }}>Dimension Validation</p>
        <Row label="Page size" val="A5 · 148 × 210 mm" />
        <Row label="Page count" val="1 หน้า" />
        <Row label="Export source" val="GoodNotes 6" />
        <div style={{ display: "flex", alignItems: "center", padding: "11px 0" }}>
          <span style={{ flex: 1, fontSize: 12, color: C.inkMd }}>Perspective distortion</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.ink, marginRight: 12 }}>&lt; 0.5%</span>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.sage, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10 }}>✓</div>
        </div>
      </div>
    </div>
  )
}

const Step3 = ({ selected }) => {
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[{ label: "OK", val: ok, color: C.sage }, { label: "Missing", val: missing, color: C.blush }, { label: "Overflow", val: overflow, color: C.amber }, { label: "ทั้งหมด", val: glyphs.length, color: C.ink }].map(s => (
          <div key={s.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 300, color: s.color, fontFamily: "'DM Serif Display', serif" }}>{s.val}</p>
            <p style={{ fontSize: 10, color: C.inkLt, marginTop: 4, letterSpacing: "0.05em" }}>{s.label}</p>
          </div>
        ))}
      </div>
      <InfoBox color="amber">MVP ตรวจเฉพาะ Missing และ Overflow — คลิก glyph เพื่อดูรายละเอียด</InfoBox>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(66px,1fr))", gap: 8 }}>
        {glyphs.map(({ ch, status }) => {
          const s = stStyle[status]
          const isActive = active === ch
          return (
            <button
              key={ch}
              className="glyph-card"
              onClick={() => setActive(isActive ? null : ch)}
              style={{ background: s.bg, border: `1.5px solid ${isActive ? C.ink : s.border}`, borderRadius: 12, padding: "8px 6px", textAlign: "center", cursor: "pointer", outline: "none" }}
            >
              <div style={{ width: "100%", aspectRatio: "1", borderRadius: 8, background: C.bgCard, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 6, color: C.ink }}>
                {status === "missing" ? <span style={{ color: C.border, fontSize: 14 }}>—</span> : ch}
              </div>
              <p style={{ fontSize: 11, fontWeight: 500, color: C.ink }}>{ch}</p>
              <p style={{ fontSize: 10, color: s.textColor, marginTop: 2 }}>{s.label}</p>
            </button>
          )
        })}
      </div>
      {active && (
        <div style={{ marginTop: 16, padding: "12px 16px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12, color: C.inkMd, lineHeight: 1.7 }}>
          <span style={{ fontWeight: 500, color: C.ink }}>"{active}"</span>{" "}
          — Bounding box: 38 × 42px · Stroke weight: 1.8px avg · Layer: Base consonant
        </div>
      )}
    </div>
  )
}

const Step4 = () => {
  const seed = SEEDS[1]
  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: C.inkLt, marginBottom: 8 }}>Document Seed</p>
        <div style={{ background: "#1E1A14", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "monospace", fontSize: 13, color: "#9E9278" }}>
            seed: <span style={{ color: "#7CC4B0", fontWeight: 600 }}>{seed}</span>
          </span>
          <span style={{ fontSize: 10, color: "#5C5340", letterSpacing: "0.05em" }}>Mulberry32 · deterministic</span>
        </div>
      </div>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: C.inkLt, marginBottom: 12 }}>DNA Parameters</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {DNA_PARAMS.map(p => (
          <div key={p.name} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{p.name}</p>
              <p style={{ fontSize: 10, color: C.inkLt, fontFamily: "monospace" }}>{p.dist}</p>
            </div>
            <div style={{ height: 4, background: C.bgMuted, borderRadius: 2, overflow: "hidden" }}>
              <div className="bar-fill" style={{ height: "100%", width: `${p.value}%`, background: C.ink, borderRadius: 2 }} />
            </div>
            <p style={{ fontSize: 10, color: C.inkLt, marginTop: 6 }}>{p.value}% variance applied</p>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[{ l: "Thai layers", v: "4", u: "layers", s: "P1 offset table" }, { l: "Glyph variants", v: "1", u: "page", s: "multi-page: future" }, { l: "Export parity", v: "100", u: "%", s: "same seed = same" }].map(s => (
          <div key={s.l} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, fontWeight: 400, color: C.ink }}>
              {s.v}<span style={{ fontSize: 12, color: C.inkLt, marginLeft: 2 }}>{s.u}</span>
            </p>
            <p style={{ fontSize: 10, color: C.inkMd, marginTop: 4 }}>{s.l}</p>
            <p style={{ fontSize: 9, color: C.inkLt, marginTop: 2 }}>{s.s}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const Step5 = () => {
  const [text, setText] = useState("สวัสดีครับ ทดสอบลายมือดิจิทัล")
  const [fontSize, setFontSize] = useState(20)
  const [lineH, setLineH] = useState(2.0)

  return (
    <div className="fade-up">
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, background: C.bgMuted, display: "flex", alignItems: "center", gap: 10 }}>
          <Tag color="draft">Draft — Canvas</Tag>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: C.inkLt }}>ขนาด</span>
              <select value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{ fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px", background: C.bgCard, color: C.ink, fontFamily: "inherit" }}>
                {[14, 16, 18, 20, 24, 28].map(s => <option key={s} value={s}>{s}px</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: C.inkLt }}>บรรทัด</span>
              <select value={lineH} onChange={e => setLineH(Number(e.target.value))} style={{ fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px", background: C.bgCard, color: C.ink, fontFamily: "inherit" }}>
                {[1.6, 1.8, 2.0, 2.2, 2.5].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ minHeight: 120, padding: "20px 24px", fontSize, lineHeight: lineH, color: C.ink, fontFamily: "'DM Serif Display', serif", letterSpacing: "0.01em" }}>
          {text || " "}<span className="cursor" />
        </div>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        placeholder="พิมพ์ข้อความที่ต้องการ..."
        style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, resize: "none", background: C.bgCard, color: C.ink, outline: "none", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, transition: "border-color 0.15s" }}
        onFocus={e => (e.target.style.borderColor = C.ink)}
        onBlur={e => (e.target.style.borderColor = C.border)}
      />
      <Divider />
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: C.inkLt, marginBottom: 14 }}>Export</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button className="glyph-card" style={{ background: C.ink, border: "none", borderRadius: 14, padding: "20px 16px", textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>📄</div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#FBF9F5", marginBottom: 4 }}>Export PDF</p>
          <p style={{ fontSize: 10, color: "#7C6E58" }}>SVG Mode · Full DNA · Deterministic</p>
        </button>
        <button className="glyph-card" style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 16px", textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>◈</div>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 4 }}>Export SVG</p>
          <p style={{ fontSize: 10, color: C.inkLt }}>Vector · โครงสร้างเดิม</p>
        </button>
      </div>
    </div>
  )
}

export default function HandwritingGeneratorApp() {
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState(() => {
    const s = new Set()
    "กขคงจABC012".split("").forEach(c => s.add(c))
    return s
  })
  const [uploaded, setUploaded] = useState(false)

  const toggle = ch =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(ch) ? next.delete(ch) : next.add(ch)
      return next
    })

  const canNext = step === 1 ? selected.size > 0 : step === 2 ? uploaded : true
  const content = {
    1: <Step1 selected={selected} onToggle={toggle} />,
    2: <Step2 uploaded={uploaded} onUpload={() => setUploaded(true)} />,
    3: <Step3 selected={selected} />,
    4: <Step4 />,
    5: <Step5 />,
  }
  const nextLabel = {
    1: "Generate Template →",
    2: "ถัดไป →",
    3: "สร้าง DNA →",
    4: "Preview →",
    5: null,
  }

  return (
    <>
      <FontLoader />
      <div className="hw-app" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <aside style={{ width: 220, minWidth: 220, background: C.bgCard, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: C.ink, lineHeight: 1.2 }}>
              Handwriting<br />Generator
            </p>
            <p style={{ fontSize: 10, color: C.inkLt, marginTop: 6, letterSpacing: "0.04em" }}>
              PDF · Rendering Engine · v2.7
            </p>
          </div>

          <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
            {STEPS.map(s => {
              const done = step > s.id
              const active = step === s.id
              const locked = s.id > step + 1
              return (
                <button
                  key={s.id}
                  onClick={() => !locked && setStep(s.id)}
                  disabled={locked}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", border: "none", outline: "none", background: active ? C.bgMuted : "transparent", cursor: locked ? "not-allowed" : "pointer", transition: "background 0.15s", borderLeft: active ? `2px solid ${C.ink}` : "2px solid transparent" }}
                >
                  <div className="step-dot" style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, letterSpacing: "0.02em", background: done ? C.sage : active ? C.ink : "transparent", border: done ? "none" : active ? "none" : `1.5px solid ${C.borderMd}`, color: done || active ? "#fff" : C.inkLt }}>
                    {done ? "✓" : s.icon}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontSize: 12, fontWeight: active ? 500 : 400, color: done ? C.sage : active ? C.ink : C.inkLt, lineHeight: 1 }}>{s.label}</p>
                  </div>
                </button>
              )
            })}
          </nav>

          <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.bgMuted, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: C.inkMd }}>T</div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 500, color: C.ink }}>ลายมือ #1</p>
                <p style={{ fontSize: 10, color: C.inkLt, marginTop: 1 }}>{selected.size} glyphs · 50 MB max</p>
              </div>
            </div>
          </div>
        </aside>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <header style={{ height: 56, flexShrink: 0, background: C.bgCard, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 28px", gap: 12 }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 500, color: C.ink }}>{STEPS[step - 1].label}</span>
              <span style={{ fontSize: 12, color: C.inkLt, marginLeft: 8 }}>— Step {step} of {STEPS.length}</span>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              {step > 1 && <Btn onClick={() => setStep(s => s - 1)} variant="ghost" size="sm">← กลับ</Btn>}
              {nextLabel[step] && <Btn onClick={() => setStep(s => s + 1)} disabled={!canNext} variant="primary" size="sm">{nextLabel[step]}</Btn>}
            </div>
          </header>

          <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", background: C.bg }}>{content[step]}</main>

          <div style={{ height: 3, background: C.border }}>
            <div style={{ height: "100%", background: C.ink, transition: "width 0.4s ease", width: `${(step / STEPS.length) * 100}%` }} />
          </div>
        </div>
      </div>
    </>
  )
}
