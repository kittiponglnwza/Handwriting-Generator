/**
 * Step4 — DNA Profile
 *
 * ARCHITECTURE ROLE: Pure consumer. Displays glyph versioning and DNA parameters.
 *
 * Props:
 *   glyphs: Glyph[]  — from appState.glyphResult.glyphs (set by Step 3)
 *
 * REMOVED:
 *   - selected     (was Step 1 legacy — eliminated)
 *   - templateChars (was Step 1 legacy — eliminated)
 *   - sourceChars useMemo that fell back to selected/templateChars
 *
 * All character data now comes exclusively from glyphs[].
 */
import { useMemo, useState } from "react"
import Btn from "../components/Btn"
import { DOCUMENT_SEED } from "../lib/documentSeed.js"
import { buildVersionedGlyphs, deformPath } from "../lib/glyphVersions.js"
import C from "../styles/colors"

const DNA_PARAMS = [
  { name: "Spacing tendency",  dist: "Normal • σ = 0.05em",       value: 62 },
  { name: "Baseline offset",   dist: "Normal • μ = 0 • σ = 1.5px", value: 45 },
  { name: "Rotation tendency", dist: "Uniform ±1.5°",             value: 50 },
  { name: "Scale variation",   dist: "Normal • σ = 0.03",          value: 38 },
]

function hashString(input) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return hash >>> 0
}

function seededUnit(seedStr) {
  return hashString(seedStr) / 4294967295
}

function mapRange(seedStr, min, max) {
  return min + seededUnit(seedStr) * (max - min)
}

function buildVariant(char, seed, version) {
  const key = `${seed}-${char}-v${version}`
  return {
    version,
    rotate: mapRange(`${key}-r`,  -4.2, 4.2),
    skewX:  mapRange(`${key}-sx`, -5.5, 5.5),
    scaleX: mapRange(`${key}-x`,   0.93, 1.08),
    scaleY: mapRange(`${key}-y`,   0.9,  1.08),
    shiftX: mapRange(`${key}-tx`, -6.5, 6.5),
    shiftY: mapRange(`${key}-ty`, -8,   6),
    weight: Math.round(mapRange(`${key}-w`, 420, 640)),
  }
}

/**
 * Props:
 *   glyphs: Glyph[]  — extracted glyphs from Step 3 (via appState.glyphResult.glyphs)
 */
export default function Step4({ glyphs = [] }) {
  const seed = DOCUMENT_SEED
  const hasFileSource = glyphs.length > 0

  const [pickedGlyphId, setPickedGlyphId] = useState("")

  const activeGlyph = useMemo(() => {
    if (!hasFileSource) return null
    return glyphs.find(g => g.id === pickedGlyphId) ?? glyphs[0] ?? null
  }, [hasFileSource, glyphs, pickedGlyphId])

  // baseChar derived directly from glyphs — never from selected/templateChars
  const baseChar   = activeGlyph?.ch ?? "ก"
  const basePreview = activeGlyph?.preview ?? ""

  const variants = useMemo(
    () => [1, 2, 3].map(v => buildVariant(baseChar, seed, v)),
    [baseChar, seed]
  )

  // Versioned glyphs for the badge count display (App.jsx also computes this
  // in a useEffect — this local version is for display purposes only)
  const versionedCount = useMemo(
    () => buildVersionedGlyphs(glyphs).length,
    [glyphs]
  )

  const handleRandom = () => {
    if (!hasFileSource || glyphs.length === 0) return
    const g = glyphs[Math.floor(Math.random() * glyphs.length)]
    if (g) setPickedGlyphId(g.id)
  }

  return (
    <div className="fade-up">
      {/* ── 1 Glyph → 3 Versions ───────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize:10, fontWeight:500, letterSpacing:"0.1em", textTransform:"uppercase", color:C.inkLt, marginBottom:8 }}>
          1 Glyph to 3 Versions
        </p>

        <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:12 }}>
          <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:12, color:C.inkMd }}>
              {hasFileSource ? "เลือกตัวจากไฟล์ PDF:" : "ยังไม่มีข้อมูล glyph"}
            </span>
            {hasFileSource && (
              <>
                <select
                  value={activeGlyph?.id ?? ""}
                  onChange={e => setPickedGlyphId(e.target.value)}
                  style={{ minWidth:180, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", fontSize:13, background:C.bgCard, color:C.ink }}
                >
                  {glyphs.map(g => (
                    <option key={g.id} value={g.id}>{g.ch} • ช่อง {g.index}</option>
                  ))}
                </select>
                <Btn onClick={handleRandom} variant="ghost" size="sm">สุ่ม</Btn>
              </>
            )}
          </div>

          <p style={{ fontSize:11, color:C.inkLt, marginTop:8 }}>
            {hasFileSource
              ? "Step 4 ดึงเส้น SVG จากไฟล์ และดัดพิกัดเส้นหมึก (Vector Deformation) สร้างเป็น 3 เวอร์ชัน"
              : "ยังไม่มีข้อมูลจากไฟล์ — กลับ Step 3 เพื่อ extract glyphs ก่อน"}
          </p>

          {hasFileSource && activeGlyph && (
            <p style={{ fontSize:11, color:C.inkLt, marginTop:4 }}>
              ตัวที่เลือก: ช่อง {activeGlyph.index ?? "—"} • {activeGlyph.ch ?? "?"} •{" "}
              สถานะ {activeGlyph.status ? String(activeGlyph.status).toUpperCase() : "UNKNOWN"}
            </p>
          )}

          {hasFileSource && (
            <div style={{ marginTop:10, display:"inline-flex", alignItems:"center", gap:6, background:"#EBF5EE", border:"1px solid #A8D5B5", borderRadius:8, padding:"4px 10px", fontSize:11, color:"#2E6B3E" }}>
              ✅ {versionedCount} versioned glyphs พร้อมส่งให้ Step 5 ({glyphs.length} ตัว × 3 versions)
            </div>
          )}
        </div>

        {/* Version preview cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {variants.map(v => (
            <div key={v.version} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14, padding:"12px 12px 14px" }}>
              <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:C.inkLt, marginBottom:8 }}>
                ver {v.version}
              </p>
              <div style={{ height:150, borderRadius:10, border:`1px dashed ${C.borderMd}`, background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
                {hasFileSource && activeGlyph && typeof activeGlyph.svgPath === "string" && activeGlyph.svgPath !== "M 0 0" ? (
                  <svg viewBox={activeGlyph.viewBox || "0 0 100 100"} style={{ width:"80%", height:"80%", overflow:"visible" }}>
                    <g style={{ transformOrigin:"center" }}>
                      <path d={deformPath(activeGlyph.svgPath, v.version)} fill="none" stroke={C.ink} strokeWidth={v.weight > 500 ? "3.5" : "2.5"} strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </svg>
                ) : basePreview ? (
                  <img src={basePreview} alt={`File glyph ${baseChar} ver ${v.version}`}
                    style={{ width:"78%", height:"78%", objectFit:"contain", transform:`translate(${v.shiftX}px,${v.shiftY}px) rotate(${v.rotate}deg) skewX(${v.skewX}deg) scale(${v.scaleX},${v.scaleY})`, transformOrigin:"center", filter:"contrast(1.08) saturate(0.9)" }} />
                ) : (
                  <span style={{ fontSize:108, lineHeight:1, color:C.ink, fontWeight:v.weight, fontFamily:"'TH Sarabun New','Noto Sans Thai','Tahoma',sans-serif", transform:`translate(${v.shiftX}px,${v.shiftY}px) rotate(${v.rotate}deg) skewX(${v.skewX}deg) scale(${v.scaleX},${v.scaleY})`, transformOrigin:"center" }}>
                    {baseChar}
                  </span>
                )}
              </div>
              <p style={{ marginTop:8, fontSize:10, color:C.inkLt, lineHeight:1.6 }}>
                {hasFileSource
                  ? (v.version === 1 ? "Ver 1: ต้นฉบับ Perfect" : v.version === 2 ? "Ver 2: หางตก" : "Ver 3: เส้นแกว่ง")
                  : `rotate ${v.rotate.toFixed(2)}° • skew ${v.skewX.toFixed(2)}°`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Document Seed ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:10, fontWeight:500, letterSpacing:"0.1em", textTransform:"uppercase", color:C.inkLt, marginBottom:8 }}>Document Seed</p>
        <div style={{ background:"#1E1A14", borderRadius:12, padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontFamily:"monospace", fontSize:13, color:"#9E9278" }}>
            seed: <span style={{ color:"#7CC4B0", fontWeight:600 }}>{seed}</span>
          </span>
          <span style={{ fontSize:10, color:"#5C5340", letterSpacing:"0.05em" }}>Mulberry32 • deterministic</span>
        </div>
      </div>

      {/* ── DNA Parameters ────────────────────────────────────────────────── */}
      <p style={{ fontSize:10, fontWeight:500, letterSpacing:"0.1em", textTransform:"uppercase", color:C.inkLt, marginBottom:12 }}>DNA Parameters</p>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
        {DNA_PARAMS.map(p => (
          <div key={p.name} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 18px" }}>
            <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:10 }}>
              <p style={{ fontSize:13, fontWeight:500, color:C.ink }}>{p.name}</p>
              <p style={{ fontSize:10, color:C.inkLt, fontFamily:"monospace" }}>{p.dist}</p>
            </div>
            <div style={{ height:4, background:C.bgMuted, borderRadius:2, overflow:"hidden" }}>
              <div className="bar-fill" style={{ height:"100%", width:`${p.value}%`, background:C.ink, borderRadius:2 }} />
            </div>
            <p style={{ fontSize:10, color:C.inkLt, marginTop:6 }}>{p.value}% variance applied</p>
          </div>
        ))}
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
        {[
          { l:"Thai layers",    v:"4",                                u:"layers",   s:"P1 offset table" },
          { l:"Glyph variants", v:"3",                                u:"versions", s:"ver 1 / ver 2 / ver 3" },
          { l:"Source",         v:hasFileSource ? "FILE" : "—",       u:"",         s:hasFileSource ? `from Step 3 (${glyphs.length} glyphs)` : "no glyphs extracted" },
        ].map(s => (
          <div key={s.l} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 12px", textAlign:"center" }}>
            <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, fontWeight:400, color:C.ink }}>
              {s.v}<span style={{ fontSize:12, color:C.inkLt, marginLeft:2 }}>{s.u}</span>
            </p>
            <p style={{ fontSize:10, color:C.inkMd, marginTop:4 }}>{s.l}</p>
            <p style={{ fontSize:9, color:C.inkLt, marginTop:2 }}>{s.s}</p>
          </div>
        ))}
      </div>
    </div>
  )
}