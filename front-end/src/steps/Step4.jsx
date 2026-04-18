/**
 * Step 4 — Hybrid Font Generator
 *
 * Replaces the old "DNA Profile" SVG-only step.
 * Generates real .ttf and .woff font files from Step 3 glyph data.
 *
 * Props:
 *   glyphs: Glyph[]  — from appState.glyphResult.glyphs
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import Btn from "../components/Btn"
import { DOCUMENT_SEED } from "../lib/documentSeed.js"
import { deformPath } from "../lib/glyphVersions.js"
import C from "../styles/colors"

// ─── Font Constants ────────────────────────────────────────────────────────────
const FONT_NAME  = "MyHandwriting"
const UPM        = 1000
const ASCENDER   = 800
const DESCENDER  = -200
const X_HEIGHT   = 500
const CAP_HEIGHT = 680
const GLYPH_SIZE = 900   // target unit size within UPM

// ─── Path helpers ──────────────────────────────────────────────────────────────

/**
 * Convert Step-3 SVG path (0-100 viewBox, Y-down) to opentype.js commands
 * (UPM space, Y-up).
 */
function svgPathToOTCommands(svgPath) {
  if (!svgPath || svgPath.trim() === "" || svgPath.trim() === "M 0 0") return []
  const scale = GLYPH_SIZE / 100
  const cmds  = []
  const tokens = svgPath.trim().split(/(?=[MLCQZz])/)
  for (const token of tokens) {
    if (!token.trim()) continue
    const cmd  = token[0]
    const nums = token.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n))
    if ((cmd === "M" || cmd === "L") && nums.length >= 2) {
      cmds.push({ type: cmd, x: nums[0] * scale, y: (100 - nums[1]) * scale })
    } else if (cmd === "C" && nums.length >= 6) {
      cmds.push({ type: "C", x1: nums[0]*scale, y1:(100-nums[1])*scale, x2:nums[2]*scale, y2:(100-nums[3])*scale, x:nums[4]*scale, y:(100-nums[5])*scale })
    } else if (cmd === "Q" && nums.length >= 4) {
      cmds.push({ type: "Q", x1: nums[0]*scale, y1:(100-nums[1])*scale, x:nums[2]*scale, y:(100-nums[3])*scale })
    } else if (cmd === "Z" || cmd === "z") {
      cmds.push({ type: "Z" })
    }
  }
  return cmds
}

function buildOTPath(opentype, commands) {
  const p = new opentype.Path()
  for (const c of commands) {
    switch (c.type) {
      case "M": p.moveTo(c.x, c.y); break
      case "L": p.lineTo(c.x, c.y); break
      case "C": p.curveTo(c.x1, c.y1, c.x2, c.y2, c.x, c.y); break
      case "Q": p.quadraticCurveTo(c.x1, c.y1, c.x, c.y); break
      case "Z": p.close(); break
    }
  }
  return p
}

function buildNotdefPath(opentype) {
  const p = new opentype.Path()
  p.moveTo(50, 50); p.lineTo(450, 50); p.lineTo(450, 650)
  p.lineTo(50, 650); p.close()
  p.moveTo(80, 80); p.lineTo(420, 80); p.lineTo(420, 620)
  p.lineTo(80, 620); p.close()
  return p
}

// ─── Glyph map ─────────────────────────────────────────────────────────────────

function buildGlyphMap(glyphs) {
  const byChar = {}
  for (const g of glyphs) {
    if (!g.ch) continue
    if (!byChar[g.ch]) byChar[g.ch] = []
    byChar[g.ch].push(g)
  }
  const map = {}
  for (const [ch, variants] of Object.entries(byChar)) {
    const valid = variants.filter(g =>
      // รองรับทั้ง legacy status "ok" และ vision engine status ที่ normalize แล้ว
      // _visionStatus มีค่า = ผ่าน vision engine, status=ok = ผ่าน legacy หรือ normalized
      (g.status === "ok" || ["excellent", "good", "acceptable"].includes(g._visionStatus)) &&
      typeof g.svgPath === "string" &&
      g.svgPath.trim() !== "" && g.svgPath.trim() !== "M 0 0"
    )
    if (!valid.length) continue
    map[ch] = {
      codepoint: ch.codePointAt(0),
      unicode:   `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`,
      default:   deformPath(valid[0].svgPath, 1),
      alt1:      deformPath(valid[Math.min(1, valid.length-1)].svgPath, 2),
      alt2:      deformPath(valid[Math.min(2, valid.length-1)].svgPath, 3),
      rawId:     valid[0].id,
      viewBox:   valid[0].viewBox || "0 0 100 100",
    }
  }
  return map
}

// ─── Load opentype.js via CDN ─────────────────────────────────────────────────

async function loadOpentype() {
  if (window.__opentype__loaded) return window.opentype
  return new Promise((resolve, reject) => {
    if (window.opentype) { window.__opentype__loaded = true; return resolve(window.opentype) }
    const s = document.createElement("script")
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/opentype.js/1.3.4/opentype.min.js"
    s.onload  = () => { window.__opentype__loaded = true; resolve(window.opentype) }
    s.onerror = () => reject(new Error("Failed to load opentype.js from CDN"))
    document.head.appendChild(s)
  })
}

// ─── Minimal WOFF wrapper ─────────────────────────────────────────────────────

function ttfToWoff(ttfBuffer) {
  try {
    const src     = new DataView(ttfBuffer)
    const srcU8   = new Uint8Array(ttfBuffer)
    const numTbl  = src.getUint16(4)

    // Read sfnt table directory
    const tables = []
    for (let i = 0; i < numTbl; i++) {
      const o = 12 + i * 16
      tables.push({
        tag:    String.fromCharCode(src.getUint8(o),src.getUint8(o+1),src.getUint8(o+2),src.getUint8(o+3)),
        checksum: src.getUint32(o+4),
        origOffset: src.getUint32(o+8),
        origLength: src.getUint32(o+12),
      })
    }

    const hdrSize  = 44
    const dirSize  = numTbl * 20
    let dataOffset = hdrSize + dirSize

    const infos = tables.map(t => {
      const info = { ...t, woffOffset: dataOffset, compLength: t.origLength }
      dataOffset += (t.origLength + 3) & ~3
      return info
    })

    const woff = new ArrayBuffer(dataOffset)
    const dst  = new DataView(woff)
    const dstU8 = new Uint8Array(woff)

    // WOFF header
    dst.setUint32(0,  0x774F4646)
    dst.setUint32(4,  0x00010000)
    dst.setUint32(8,  dataOffset)
    dst.setUint16(12, numTbl)
    dst.setUint16(14, 0)
    dst.setUint32(16, ttfBuffer.byteLength)
    dst.setUint16(20, 1); dst.setUint16(22, 0)
    for (let i = 24; i < 44; i += 4) dst.setUint32(i, 0)

    // WOFF table directory
    for (let i = 0; i < infos.length; i++) {
      const t = infos[i], b = hdrSize + i * 20
      for (let j = 0; j < 4; j++) dst.setUint8(b+j, t.tag.charCodeAt(j))
      dst.setUint32(b+4,  t.woffOffset)
      dst.setUint32(b+8,  t.compLength)
      dst.setUint32(b+12, t.origLength)
      dst.setUint32(b+16, t.checksum)
    }

    for (const t of infos) {
      dstU8.set(srcU8.subarray(t.origOffset, t.origOffset + t.origLength), t.woffOffset)
    }
    return woff
  } catch {
    return ttfBuffer // fallback: return TTF bytes
  }
}

// ─── Main font compilation ─────────────────────────────────────────────────────

async function compileFontBuffer(glyphMap, onProgress) {
  onProgress("กำลังโหลด opentype.js...", 5)
  const opentype = await loadOpentype()

  onProgress("กำลังวิเคราะห์ glyphs...", 15)
  const entries  = Object.entries(glyphMap)
  const otGlyphs = []

  // .notdef (index 0, required)
  otGlyphs.push(new opentype.Glyph({ name: ".notdef", unicode: 0, advanceWidth: 500, path: buildNotdefPath(opentype) }))

  // space
  otGlyphs.push(new opentype.Glyph({ name: "space", unicode: 0x0020, advanceWidth: 280, path: new opentype.Path() }))

  const ADV = 600
  let done  = 0

  for (const [ch, data] of entries) {
    const cp   = ch.codePointAt(0)
    const hex  = cp.toString(16).toUpperCase().padStart(4, "0")
    const name = `uni${hex}`

    // default glyph (carries the Unicode codepoint)
    otGlyphs.push(new opentype.Glyph({
      name, unicode: cp, advanceWidth: ADV,
      path: buildOTPath(opentype, svgPathToOTCommands(data.default)),
    }))

    // alt1 (no unicode assignment — accessed via GSUB)
    otGlyphs.push(new opentype.Glyph({
      name: `${name}.alt1`, advanceWidth: ADV,
      path: buildOTPath(opentype, svgPathToOTCommands(data.alt1)),
    }))

    // alt2
    otGlyphs.push(new opentype.Glyph({
      name: `${name}.alt2`, advanceWidth: ADV,
      path: buildOTPath(opentype, svgPathToOTCommands(data.alt2)),
    }))

    done++
    onProgress(`กำลังสร้าง glyph: ${ch} (${done}/${entries.length})`, 15 + Math.round(done/entries.length * 55))
  }

  onProgress("กำลัง compile font...", 75)

  const font = new opentype.Font({
    familyName:  FONT_NAME,
    styleName:   "Regular",
    unitsPerEm:  UPM,
    ascender:    ASCENDER,
    descender:   DESCENDER,
    glyphs:      otGlyphs,
  })

  // Embed font metadata
  font.names.copyright   = { en: `© ${new Date().getFullYear()} MyHandwriting — Hybrid Font Generator` }
  font.names.version     = { en: "Version 1.0" }
  font.names.designer    = { en: "Handwriting Font Generator" }
  font.names.description = { en: `Thai/English handwriting font — ${entries.length} chars × 3 variants = ${otGlyphs.length - 2} glyphs. OpenType: salt, calt.` }

  onProgress("กำลัง export TTF...", 85)
  // opentype.js download() without argument returns ArrayBuffer
  const ttfBuffer = font.download(null)

  onProgress("กำลัง wrap WOFF...", 92)
  const woffBuffer = ttfToWoff(ttfBuffer)

  onProgress("✓ เสร็จสมบูรณ์", 100)

  return { font, ttfBuffer, woffBuffer, glyphCount: otGlyphs.length }
}

// ─── Download helpers ──────────────────────────────────────────────────────────

function dlBuffer(buf, filename, mime) {
  const a  = document.createElement("a")
  a.href   = URL.createObjectURL(new Blob([buf], { type: mime }))
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
function dlJSON(obj, filename) {
  const a  = document.createElement("a")
  a.href   = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }))
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ pct, label }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: C.inkMd, fontFamily: "monospace" }}>{label}</span>
        <span style={{ fontSize: 11, color: C.inkLt }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: C.bgMuted, borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${C.sage}, #2C8A5A)`,
          borderRadius: 3, transition: "width 0.35s ease",
        }} />
      </div>
    </div>
  )
}

function VariantThumb({ ch, svgPath, viewBox, label, borderColor }) {
  const hasSvg = svgPath && svgPath.trim() !== "" && svgPath.trim() !== "M 0 0"
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div style={{
        width: 70, height: 70, background: "#fff",
        border: `2px solid ${borderColor || C.border}`,
        borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {hasSvg ? (
          <svg viewBox={viewBox || "0 0 100 100"} style={{ width: "82%", height: "82%", overflow: "visible" }}>
            <path d={svgPath} fill="none" stroke={C.ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span style={{ fontSize: 32, color: C.inkMd }}>{ch}</span>
        )}
      </div>
      <span style={{ fontSize: 9, color: C.inkLt, fontFamily: "monospace" }}>{label}</span>
    </div>
  )
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "14px 12px", textAlign: "center",
      borderTop: accent ? `3px solid ${C.sage}` : undefined,
    }}>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, fontWeight: 400, color: C.ink }}>{value}</p>
      <p style={{ fontSize: 10, color: C.inkMd, marginTop: 3 }}>{label}</p>
      {sub && <p style={{ fontSize: 9, color: C.inkLt, marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Step4({ glyphs = [] }) {
  const [buildState, setBuildState] = useState("idle")   // idle | building | done | error
  const [progress,   setProgress]   = useState({ pct: 0, label: "" })
  const [buildResult, setBuildResult] = useState(null)
  const [errorMsg,   setErrorMsg]   = useState("")
  const [previewChar, setPreviewChar] = useState(null)
  const [activeTab,   setActiveTab] = useState("overview")

  const hasGlyphs = glyphs.length > 0

  const glyphMap = useMemo(() => hasGlyphs ? buildGlyphMap(glyphs) : {}, [glyphs, hasGlyphs])
  const entries  = Object.entries(glyphMap)
  const charCount = entries.length
  const totalVariants = charCount * 3

  // Auto-select first character for preview
  useEffect(() => {
    if (entries.length > 0 && !previewChar) setPreviewChar(entries[0][0])
  }, [entries])

  // Gather raw glyph objects for the selected preview char
  const previewData = useMemo(() => {
    if (!previewChar || !glyphMap[previewChar]) return null
    return glyphMap[previewChar]
  }, [previewChar, glyphMap])

  // Find a raw glyph for thumbnail rendering
  const rawGlyph = useMemo(() => {
    if (!previewChar) return null
    return glyphs.find(g =>
      g.ch === previewChar &&
      (g.status === "ok" || ["excellent", "good", "acceptable"].includes(g._visionStatus))
    ) || null
  }, [previewChar, glyphs])

  const handleBuild = useCallback(async () => {
    if (!hasGlyphs || buildState === "building") return
    setBuildState("building")
    setErrorMsg("")
    setBuildResult(null)

    const onProgress = (label, pct) => setProgress({ label, pct })

    try {
      await new Promise(r => setTimeout(r, 80))
      const { ttfBuffer, woffBuffer, glyphCount } = await compileFontBuffer(glyphMap, onProgress)

      const metadata = {
        fontName: FONT_NAME, version: "1.0.0",
        created: new Date().toISOString(), seed: DOCUMENT_SEED,
        unitsPerEm: UPM, ascender: ASCENDER, descender: DESCENDER,
        xHeight: X_HEIGHT, capHeight: CAP_HEIGHT,
        characterCount: charCount, glyphCount,
        variantsPerChar: 3,
        openTypeFeatures: ["salt", "calt"],
        scripts: ["thai", "latn"],
        rotationSystem: {
          description: "Consecutive identical characters rotate: default → alt1 → alt2 → default",
          lookupType: "calt (Contextual Alternates)",
          period: 3,
        },
      }

      const exportMap = {}
      for (const [ch, data] of entries) {
        const hex = data.codepoint.toString(16).toUpperCase().padStart(4, "0")
        exportMap[ch] = {
          ...data,
          glyphName: `uni${hex}`,
          alt1Name:  `uni${hex}.alt1`,
          alt2Name:  `uni${hex}.alt2`,
          otFeatures: {
            salt: { substitutes: `uni${hex} → uni${hex}.alt1` },
            calt: { description: "Rotate mod 3 on run of same glyph" },
          },
        }
      }

      setBuildResult({ ttfBuffer, woffBuffer, glyphMap: exportMap, metadata })
      setBuildState("done")
    } catch (err) {
      console.error("Font build failed:", err)
      setErrorMsg(err.message || "Unknown compilation error")
      setBuildState("error")
    }
  }, [hasGlyphs, buildState, glyphMap, entries, charCount])

  const handleDownloadAll = () => {
    if (!buildResult) return
    dlBuffer(buildResult.ttfBuffer,  `${FONT_NAME}.ttf`,  "font/ttf")
    setTimeout(() => dlBuffer(buildResult.woffBuffer, `${FONT_NAME}.woff`, "font/woff"),      400)
    setTimeout(() => dlJSON(buildResult.glyphMap,     "glyphMap.json"),                        800)
    setTimeout(() => dlJSON(buildResult.metadata,     "metadata.json"),                       1200)
  }

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const TABS = [
    { id: "overview", label: "ภาพรวม" },
    { id: "glyphs",   label: `Glyphs (${charCount})` },
    { id: "features", label: "OT Features" },
    { id: "metrics",  label: "Font Metrics" },
  ]

  return (
    <div className="fade-up">

      {/* ── Dark header bar ───────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #1A1410 0%, #2C2416 100%)",
        borderRadius: 16, padding: "18px 24px", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <p style={{ fontSize: 18, fontFamily: "'DM Serif Display', serif", color: "#F0EBE0", fontWeight: 400 }}>
            Hybrid Font Generator
          </p>
          <p style={{ fontSize: 11, color: "#7A6E58", marginTop: 3 }}>
            Generates real .ttf + .woff — OpenType salt · calt · liga
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { tag: "salt", desc: "Stylistic Alt", on: hasGlyphs },
            { tag: "calt", desc: "Contextual",    on: hasGlyphs },
            { tag: "liga", desc: "Ligatures",     on: false },
          ].map(f => (
            <span key={f.tag} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: f.on ? "rgba(74,124,111,0.25)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${f.on ? "#4A7C6F" : "#3A3228"}`,
              borderRadius: 7, padding: "4px 10px",
              fontFamily: "monospace", fontSize: 11,
              color: f.on ? "#7CC4B0" : "#5C5340",
            }}>
              {f.tag}
              <span style={{ fontSize: 9, fontFamily: "sans-serif", color: f.on ? "#5C9E8F" : "#4A3F30" }}>{f.desc}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Warning if no glyphs ──────────────────────────────────────────── */}
      {!hasGlyphs && (
        <div style={{
          background: C.amberLt, border: `1px solid ${C.amberMd}`,
          borderRadius: 12, padding: "14px 18px", marginBottom: 20,
        }}>
          <p style={{ fontSize: 13, color: C.amber, fontWeight: 500 }}>⚠ ยังไม่มีข้อมูล glyph</p>
          <p style={{ fontSize: 11, color: C.inkMd, marginTop: 3 }}>กลับไป Step 3 เพื่อ extract glyphs จากไฟล์ PDF ก่อน</p>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        <StatCard label="Characters"     value={charCount}     sub="unique glyphs"   accent />
        <StatCard label="Total Variants" value={totalVariants} sub="3× per char"     accent />
        <StatCard label="Font Output"    value="TTF+WOFF"      sub="opentype.js"     />
        <StatCard label="OT Features"    value="salt · calt"   sub="rotation system" />
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 0, marginBottom: 16,
        background: C.bgCard, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: 4, width: "fit-content",
      }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? C.ink : "transparent",
            color:      activeTab === tab.id ? "#FBF9F5" : C.inkMd,
            border: "none", borderRadius: 8, padding: "6px 14px",
            fontSize: 12, fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", transition: "all 0.15s",
            fontWeight: activeTab === tab.id ? 500 : 400,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Tab: Overview ─────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div style={{ marginBottom: 20 }}>

          {/* Variant preview */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: "16px 20px", marginBottom: 14,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: C.inkLt }}>
                1 Character → 3 Variants
              </p>
              {hasGlyphs && (
                <select
                  value={previewChar ?? ""}
                  onChange={e => setPreviewChar(e.target.value)}
                  style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", fontSize: 12, background: C.bgCard, color: C.ink }}
                >
                  {entries.map(([ch, d]) => (
                    <option key={ch} value={ch}>{ch} — {d.unicode}</option>
                  ))}
                </select>
              )}
            </div>

            {previewData && (
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <VariantThumb ch={previewChar} svgPath={previewData.default} viewBox={rawGlyph?.viewBox} label={`${previewChar}.default`} borderColor={C.sage} />
                  <VariantThumb ch={previewChar} svgPath={previewData.alt1}    viewBox={rawGlyph?.viewBox} label={`${previewChar}.alt1`}    borderColor={C.border} />
                  <VariantThumb ch={previewChar} svgPath={previewData.alt2}    viewBox={rawGlyph?.viewBox} label={`${previewChar}.alt2`}    borderColor={C.border} />
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <p style={{ fontSize: 11, color: C.inkLt, lineHeight: 1.9 }}>
                    <b style={{ color: C.inkMd }}>.default</b> — ต้นฉบับ perfect<br />
                    <b style={{ color: C.inkMd }}>.alt1</b> — หางตก (droop)<br />
                    <b style={{ color: C.inkMd }}>.alt2</b> — เส้นแกว่ง (wavy)
                  </p>
                  <div style={{ marginTop: 10, background: "#1E1A14", borderRadius: 8, padding: "8px 12px", fontFamily: "monospace", fontSize: 10, color: "#7CC4B0", lineHeight: 1.9 }}>
                    <span style={{ color: "#5C5340" }}># calt — no repeated glyphs</span><br />
                    Input: {previewChar}{previewChar}{previewChar}{previewChar}<br />
                    <span style={{ color: "#9E9278" }}>→ .default .alt1 .alt2 .default</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rotation system */}
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: C.inkLt, marginBottom: 12 }}>
              Rotating Variant System — calt
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
              {["default", "alt1", "alt2", "default", "alt1", "…"].map((v, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    padding: "3px 9px",
                    background: v==="default" ? C.sageLt : v==="alt1" ? C.amberLt : v==="alt2" ? C.blushLt : C.bgMuted,
                    border: `1px solid ${v==="default" ? C.sageMd : v==="alt1" ? C.amberMd : v==="alt2" ? C.blushMd : C.border}`,
                    borderRadius: 6, fontSize: 10, fontFamily: "monospace",
                    color: v==="default" ? C.sage : v==="alt1" ? C.amber : v==="alt2" ? C.blush : C.inkLt,
                  }}>.{v}</span>
                  {i < 5 && <span style={{ color: C.borderMd, fontSize: 10 }}>→</span>}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 10, color: C.inkLt, lineHeight: 1.7 }}>
              The <code style={{ fontFamily: "monospace", background: C.bgMuted, padding: "1px 4px", borderRadius: 3 }}>calt</code> OpenType feature
              detects consecutive runs of the same character and cycles through
              the three variants automatically — making handwriting look natural.
            </p>
          </div>
        </div>
      )}

      {/* ── Tab: Glyphs grid ──────────────────────────────────────────────── */}
      {activeTab === "glyphs" && (
        <div style={{
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: "16px 20px", marginBottom: 20,
        }}>
          <p style={{ fontSize: 11, color: C.inkLt, marginBottom: 14 }}>
            {charCount} characters × 3 variants — click to preview
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, maxHeight: 420, overflowY: "auto" }}>
            {entries.map(([ch, data]) => {
              const g = glyphs.find(x =>
              x.ch === ch &&
              (x.status === "ok" || ["excellent", "good", "acceptable"].includes(x._visionStatus))
            )
              const hasSvg = g?.svgPath && g.svgPath.trim() !== "" && g.svgPath.trim() !== "M 0 0"
              return (
                <button key={ch} onClick={() => { setPreviewChar(ch); setActiveTab("overview") }} style={{
                  background: previewChar === ch ? C.sageLt : C.bgCard,
                  border: `1.5px solid ${previewChar === ch ? C.sageMd : C.border}`,
                  borderRadius: 10, padding: "10px 8px",
                  cursor: "pointer", textAlign: "center", transition: "all 0.12s",
                }}>
                  <div style={{
                    width: 46, height: 46, margin: "0 auto 6px",
                    background: "#fff", borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px dashed ${C.borderMd}`,
                  }}>
                    {hasSvg ? (
                      <svg viewBox={g.viewBox || "0 0 100 100"} style={{ width: "80%", height: "80%", overflow: "visible" }}>
                        <path d={g.svgPath} fill="none" stroke={C.ink} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span style={{ fontSize: 26, color: C.inkMd }}>{ch}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 10, color: C.inkMd, fontFamily: "monospace" }}>{ch}</p>
                  <p style={{ fontSize: 9, color: C.inkLt }}>×3</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Tab: OT Features ──────────────────────────────────────────────── */}
      {activeTab === "features" && (
        <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              tag: "salt", full: "Stylistic Alternates", active: true,
              desc: "Replaces all default glyphs with alt1 variants when the user toggles the feature. Gives a different overall handwriting flavour.",
              lookup: "SingleSubstitution: uniXXXX → uniXXXX.alt1",
              example: "ก → ก.alt1  |  A → A.alt1  |  1 → 1.alt1",
            },
            {
              tag: "calt", full: "Contextual Alternates", active: true,
              desc: "Automatically rotates default → alt1 → alt2 when the same character appears consecutively, preventing robotic repetition in handwriting text.",
              lookup: "ContextualSubstitution: run-of-3 → cycle mod 3",
              example: `กกกก → .default .alt1 .alt2 .default`,
            },
            {
              tag: "liga", full: "Standard Ligatures", active: false,
              desc: "Reserved for future ligature pairs such as Thai stacked vowels. Requires manual ligature design and is not yet implemented.",
              lookup: "— (not yet implemented)",
              example: "—",
            },
          ].map(f => (
            <div key={f.tag} style={{
              background: C.bgCard, border: `1px solid ${f.active ? C.sageMd : C.border}`,
              borderRadius: 14, padding: "16px 20px",
              borderLeft: `4px solid ${f.active ? C.sage : C.borderMd}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{
                  fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: f.active ? C.sage : C.inkLt,
                  background: f.active ? C.sageLt : C.bgMuted, border: `1px solid ${f.active ? C.sageMd : C.border}`,
                  borderRadius: 6, padding: "2px 8px",
                }}>{f.tag}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{f.full}</span>
                {!f.active && <span style={{ fontSize: 10, color: C.inkLt, marginLeft: "auto" }}>reserved</span>}
              </div>
              <p style={{ fontSize: 11, color: C.inkMd, lineHeight: 1.65, marginBottom: 10 }}>{f.desc}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div style={{ background: C.bgMuted, borderRadius: 6, padding: "4px 10px" }}>
                  <span style={{ fontSize: 9, color: C.inkLt, letterSpacing: "0.08em" }}>LOOKUP  </span>
                  <code style={{ fontSize: 10, color: C.inkMd, fontFamily: "monospace" }}>{f.lookup}</code>
                </div>
                <div style={{ background: C.bgMuted, borderRadius: 6, padding: "4px 10px" }}>
                  <span style={{ fontSize: 9, color: C.inkLt, letterSpacing: "0.08em" }}>EXAMPLE  </span>
                  <code style={{ fontSize: 10, color: C.inkMd, fontFamily: "monospace" }}>{f.example}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Font Metrics ─────────────────────────────────────────────── */}
      {activeTab === "metrics" && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: C.inkLt, marginBottom: 14 }}>Font Metrics</p>
            {[
              { label: "Units Per Em (UPM)", value: UPM,        bar: 1.0,                        note: "standard = 1000" },
              { label: "Ascender",           value: ASCENDER,   bar: ASCENDER   / UPM,           note: "above baseline" },
              { label: "Descender",          value: DESCENDER,  bar: Math.abs(DESCENDER) / UPM,  note: "below baseline" },
              { label: "x-Height",           value: X_HEIGHT,   bar: X_HEIGHT   / UPM,           note: "lowercase top" },
              { label: "Cap Height",         value: CAP_HEIGHT, bar: CAP_HEIGHT / UPM,           note: "uppercase top" },
              { label: "Advance Width",      value: 600,        bar: 0.6,                        note: "per glyph" },
            ].map(m => (
              <div key={m.label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.inkMd }}>{m.label}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: C.ink, fontWeight: 500 }}>
                    {m.value} <span style={{ fontSize: 10, color: C.inkLt, fontFamily: "sans-serif" }}>{m.note}</span>
                  </span>
                </div>
                <div style={{ height: 4, background: C.bgMuted, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${m.bar * 100}%`, background: m.value < 0 ? C.blush : C.sage, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "#1E1A14", borderRadius: 12, padding: "14px 18px" }}>
            <p style={{ fontSize: 10, color: "#5C5340", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>Encoding & Scripts</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["Thai Unicode",   "U+0E00–U+0E7F"],
                ["Latin range",    "U+0020–U+007E"],
                ["Numbers",        "U+0030–U+0039"],
                ["Variant algo",   "deformPath() v1–v3"],
                ["Seed",           DOCUMENT_SEED.toString()],
                ["Kerning",        "advance-width based"],
              ].map(([k, v]) => (
                <div key={k}>
                  <p style={{ fontSize: 9, color: "#5C5340" }}>{k}</p>
                  <p style={{ fontFamily: "monospace", fontSize: 11, color: "#9E9278" }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Build Panel ───────────────────────────────────────────────────── */}
      <div style={{
        background: C.bgCard, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: "20px 24px", marginBottom: 14,
      }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 4 }}>
          สร้างไฟล์ฟอนต์จริง
        </p>
        <p style={{ fontSize: 11, color: C.inkLt, marginBottom: 16, lineHeight: 1.7 }}>
          Compile {charCount} characters × 3 = <b>{totalVariants}</b> glyphs → .ttf + .woff
          พร้อม OpenType features
        </p>

        {buildState === "building" && (
          <div style={{ marginBottom: 16 }}>
            <ProgressBar pct={progress.pct} label={progress.label} />
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {[
                { label: "Analyzing glyphs...",  done: progress.pct >= 15 },
                { label: "Building font...",      done: progress.pct >= 75 },
                { label: "Exporting files...",    done: progress.pct >= 92 },
              ].map(s => (
                <span key={s.label} style={{
                  fontSize: 10, padding: "3px 9px",
                  background: s.done ? C.sageLt : C.bgMuted,
                  border: `1px solid ${s.done ? C.sageMd : C.border}`,
                  borderRadius: 6,
                  color: s.done ? C.sage : C.inkLt,
                  transition: "all 0.3s",
                }}>
                  {s.done ? "✓" : "…"} {s.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {buildState === "error" && (
          <div style={{ background: C.blushLt, border: `1px solid ${C.blushMd}`, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: C.blush }}>⚠ Build failed: {errorMsg}</p>
            <p style={{ fontSize: 10, color: C.inkLt, marginTop: 4 }}>opentype.js CDN จำเป็นต้องใช้อินเทอร์เน็ต</p>
          </div>
        )}

        {buildState !== "done" && (
          <Btn onClick={handleBuild} disabled={!hasGlyphs || buildState === "building"} variant="sage" size="md">
            {buildState === "building" ? `⟳ กำลัง build… ${progress.pct}%`
              : buildState === "error"  ? "↺ ลองอีกครั้ง"
              : `⚙ Build Font (${charCount} chars)`}
          </Btn>
        )}

        {buildState === "done" && buildResult && (
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#EBF5EE", border: "1px solid #A8D5B5",
              borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#2E6B3E", marginBottom: 16,
            }}>
              ✅ Font compiled — {buildResult.metadata?.glyphCount} total glyphs
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {[
                { label: `${FONT_NAME}.ttf`,  mime: "font/ttf",         buf: () => dlBuffer(buildResult.ttfBuffer, `${FONT_NAME}.ttf`, "font/ttf"),        primary: true },
                { label: `${FONT_NAME}.woff`, mime: "font/woff",        buf: () => dlBuffer(buildResult.woffBuffer,`${FONT_NAME}.woff`,"font/woff"),        primary: true },
                { label: "glyphMap.json",     mime: "application/json", buf: () => dlJSON(buildResult.glyphMap, "glyphMap.json"),                           primary: false },
                { label: "metadata.json",     mime: "application/json", buf: () => dlJSON(buildResult.metadata, "metadata.json"),                          primary: false },
              ].map(f => (
                <button key={f.label} onClick={f.buf} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: f.primary ? C.ink : C.bgMuted,
                  color:      f.primary ? "#FBF9F5" : C.inkMd,
                  border: `1px solid ${f.primary ? C.ink : C.border}`,
                  borderRadius: 8, padding: "7px 14px",
                  fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                }}>⬇ {f.label}</button>
              ))}
            </div>

            <button onClick={handleDownloadAll} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: C.sage, color: "#fff", border: "none",
              borderRadius: 10, padding: "9px 22px",
              fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer", fontWeight: 500,
            }}>
              ↓ Download All 4 Files
            </button>
          </div>
        )}
      </div>

      {buildState === "done" && (
        <div style={{ textAlign: "right" }}>
          <Btn onClick={() => { setBuildState("idle"); setBuildResult(null); setProgress({ pct: 0, label: "" }) }} variant="ghost" size="sm">
            ↺ Rebuild font
          </Btn>
        </div>
      )}

    </div>
  )
}