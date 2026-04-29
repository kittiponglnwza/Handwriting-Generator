/**
 * Step1 — Template Generator
 */
import { useState } from "react"

const DIGITS = "0123456789".split("")
const ENG_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
const ENG_LOWER = "abcdefghijklmnopqrstuvwxyz".split("")
const SPECIAL_CHARS = [
  "!","@","#","$","%","^","&","*","(",")","-","_","=","+",
  "[","]","{","}",";",":","'",'"',",",".","<",">","/","?","\\","|","`","~",
]

const GROUPS = [
  { label: "English A-Z",   chars: ENG_UPPER },
  { label: "English a-z",   chars: ENG_LOWER },
  { label: "Digits",        chars: DIGITS },
  { label: "Special Chars", chars: SPECIAL_CHARS },
]

const ALL_CHARS = GROUPS.flatMap(g => g.chars)

// ─── QR helpers ───────────────────────────────────────────────────────────────
const ensureQrLib = () => {
  if (window._qrLoaded) return Promise.resolve()
  return new Promise((res, rej) => {
    const s = document.createElement("script")
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"
    s.onload = () => { window._qrLoaded = true; res() }
    s.onerror = rej
    document.head.appendChild(s)
  })
}

const makeQrDataUrl = async (text) => {
  try {
    await ensureQrLib()
    let qr = null
    for (const typeNum of [0, 10, 15, 20, 25, 30, 40]) {
      try { qr = window.qrcode(typeNum, "M"); qr.addData(text, "Byte"); qr.make(); break }
      catch { qr = null }
    }
    if (!qr) return null
    const size = qr.getModuleCount(), scale = 4, dim = size * scale
    const canvas = document.createElement("canvas")
    canvas.width = dim; canvas.height = dim
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, dim, dim)
    ctx.fillStyle = "#000000"
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (qr.isDark(r, c)) ctx.fillRect(c * scale, r * scale, scale, scale)
    return canvas.toDataURL("image/png")
  } catch (e) { console.warn("QR generation failed:", e); return null }
}

const escapeHtml = t =>
  t.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
   .replaceAll('"',"&quot;").replaceAll("'","&#039;")

const escapeHgChar = ch => {
  if (!ch) return ""
  return [...ch].map(c => {
    const cp = c.codePointAt(0)
    return (cp >= 0x0E00 && cp <= 0x0E7F)
      ? `&#x${cp.toString(16).toUpperCase().padStart(4,"0")};`
      : escapeHtml(c)
  }).join("")
}

const encodeHgQrCharsPayload = chars => {
  const bytes = new TextEncoder().encode(JSON.stringify(chars))
  let b = ""
  for (let i = 0; i < bytes.length; i++) b += String.fromCharCode(bytes[i])
  return btoa(b).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")
}

// ─── PDF helpers ──────────────────────────────────────────────────────────────
const COLS = 6, ROWS = 6, CPP = 36

const makeCell = (ch, index) => `
  <div class="cell">
    <span class="cell-label">${escapeHtml(ch)}</span>
    <span class="cell-index">${index + 1}</span>
    <p class="hgchar-tag">HGCHAR:${index + 1}=${escapeHgChar(ch)}</p>
    <div class="reg-tl"></div><div class="reg-tr"></div>
    <div class="reg-bl"></div><div class="reg-br"></div>
    <div class="guide guide-top"></div>
    <div class="guide guide-mid"></div>
    <div class="guide guide-base"></div>
  </div>`

async function buildSheet(chars, pageIndex, pageCount, title, label) {
  const pageStart = pageIndex * CPP
  const pageChars = chars.slice(pageStart, pageStart + CPP)
  const cellFrom = pageStart + 1, cellTo = pageStart + pageChars.length
  const rows = []
  for (let rs = 0; rs < pageChars.length; rs += COLS) {
    const cells = pageChars.slice(rs, rs + COLS).map((ch, i) => makeCell(ch, pageStart + rs + i)).join("")
    rows.push(`<div class="row">${cells}</div>`)
  }
  let qrPayload = `HG:p=${pageIndex+1}/${pageCount},c=${cellFrom}-${cellTo},n=${pageChars.length},t=${chars.length},j=${encodeHgQrCharsPayload(pageChars)}`
  let qrDataUrl = await makeQrDataUrl(qrPayload)
  if (!qrDataUrl || qrPayload.length > 2300) {
    qrPayload = `HG:p=${pageIndex+1}/${pageCount},c=${cellFrom}-${cellTo},n=${pageChars.length},t=${chars.length}`
    qrDataUrl = await makeQrDataUrl(qrPayload)
  }
  const qrImg = qrDataUrl ? `<img src="${qrDataUrl}" class="page-qr" title="${qrPayload}" />` : `<span class="page-qr-fallback">${qrPayload}</span>`
  const header = `<div class="header"><h1 class="title">${escapeHtml(title)}</h1><p class="meta">${escapeHtml(label)} • ${chars.length} chars • Page ${pageIndex+1}/${pageCount} • Cells ${cellFrom}–${cellTo}</p>${qrImg}</div>`
  const meta = `<p style="font-size:1px;color:transparent;user-select:none">HGMETA:page=${pageIndex+1},totalPages=${pageCount},from=${cellFrom},to=${cellTo},count=${pageChars.length},total=${chars.length},j=${encodeHgQrCharsPayload(pageChars)}</p>`
  return `<section class="sheet">${header}<div class="grid">${rows.join("")}</div><p class="footer">${escapeHtml(label)} • ${pageIndex+1}/${pageCount}</p>${meta}</section>`
}

const CSS = `
  @page{size:A4;margin:14mm}*{box-sizing:border-box}
  body{margin:0;font-family:"TH Sarabun New","Noto Sans Thai","Tahoma",sans-serif;color:#193656;background:#FFF}
  .header{margin-bottom:6mm;padding:4mm 0 5mm;border-bottom:1px solid #C5D5E6;position:relative}
  .title{font-size:18px;font-weight:700;margin:0 0 3px}.meta{font-size:11px;color:#4B6480;margin:0}
  .grid{display:flex;flex-direction:column;gap:7px}
  .row{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;break-inside:avoid;page-break-inside:avoid}
  .cell{position:relative;border:1.1px solid #8EA9C7;border-radius:6px;background:#FFF;height:28.5mm;overflow:hidden;break-inside:avoid;page-break-inside:avoid}
  .cell-label{position:absolute;top:3px;left:5px;font-size:10px;color:#4F6B89;z-index:2;font-family:"DM Sans",Arial,sans-serif;line-height:1}
  .cell-index{position:absolute;top:2px;right:4px;font-size:7px;color:#8EA9C7;font-family:"DM Sans",Arial,sans-serif;font-weight:600;line-height:1;z-index:2;pointer-events:none;user-select:none}
  .reg-tl,.reg-tr,.reg-bl,.reg-br{position:absolute;width:4px;height:4px;border-radius:50%;background:#3A7BD5;z-index:3}
  .reg-tl{top:2px;left:2px}.reg-tr{top:2px;right:2px}.reg-bl{bottom:2px;left:2px}.reg-br{bottom:2px;right:2px}
  .guide{position:absolute;left:4%;width:92%;border-top:1px solid #A8C1DD;pointer-events:none}
  .guide-top{top:24%}.guide-mid{top:49%}.guide-base{top:75%}
  .footer{margin-top:5mm;text-align:right;font-size:10px;color:#5C7694;font-family:"DM Sans",Arial,sans-serif}
  .page-qr{position:absolute;top:4mm;right:0;width:18mm;height:18mm;image-rendering:pixelated}
  .page-qr-fallback{position:absolute;top:4mm;right:0;font-size:6px;color:#888}
  .hgchar-tag{position:absolute;font-size:1px;color:transparent;pointer-events:none;user-select:none;margin:0;padding:0;line-height:0}
  .sheet{break-inside:avoid;page-break-inside:avoid;break-after:page;page-break-after:always}
  .sheet:last-of-type{break-after:auto;page-break-after:auto}`

function openPrint(sheets) {
  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"/><title>Handwriting Template</title><style>${CSS}</style></head><body>${sheets}<script>window.addEventListener("load",()=>{const r=()=>setTimeout(()=>window.print(),220);if(document.fonts&&document.fonts.ready){document.fonts.ready.then(r)}else{r()}})<\/script></body></html>`
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, "_blank")
  if (!win) { window.alert("Could not open print window — please allow pop-ups and try again."); return }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

async function generateTemplatePdfByGroup(selectedSet, groups) {
  const activeGroups = groups
    .map(g => ({ label: g.label, chars: g.chars.filter(ch => selectedSet.has(ch)) }))
    .filter(g => g.chars.length > 0)
  if (!activeGroups.length) return
  const allSheets = []
  for (const g of activeGroups) {
    const pc = Math.ceil(g.chars.length / CPP)
    const sheets = await Promise.all(Array.from({length: pc}, (_, i) => buildSheet(g.chars, i, pc, `Handwriting Generator — ${g.label}`, g.label)))
    allSheets.push(...sheets)
  }
  openPrint(allSheets.join(""))
}

async function generateTemplatePdf(chars) {
  if (!chars.length) return
  const pc = Math.ceil(chars.length / CPP)
  const sheets = await Promise.all(Array.from({length: pc}, (_, i) => buildSheet(chars, i, pc, "Handwriting Generator Template", "All chars")))
  openPrint(sheets.join(""))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SpinIcon() {
  return (
    <span style={{
      display: "inline-block", width: 11, height: 11,
      border: "1.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff",
      borderRadius: "50%", animation: "spin .7s linear infinite", verticalAlign: "middle",
    }} />
  )
}

function inlineLinkBtn(disabled) {
  return {
    background: "none", border: "none",
    fontSize: 11, color: disabled ? "#C8BBAA" : "#9E9278",
    cursor: disabled ? "not-allowed" : "pointer",
    padding: "2px 4px", fontFamily: "'DM Sans', sans-serif",
    textDecoration: disabled ? "none" : "underline",
    textDecorationColor: "#C8BBAA", textUnderlineOffset: "2px",
  }
}

function MinimalGroup({ label, chars, selected, onToggle, onSelectGroup, onClearGroup }) {
  const cnt = chars.reduce((n, ch) => selected.has(ch) ? n + 1 : n, 0)
  const all = cnt === chars.length && chars.length > 0

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9E9278", marginRight: "auto" }}>
          {label}
          {cnt > 0 && <span style={{ marginLeft: 6, color: "#3C3628", fontWeight: 700 }}>{cnt}/{chars.length}</span>}
        </span>
        <button onClick={() => onSelectGroup(chars)} disabled={all} style={inlineLinkBtn(all)}>Select all</button>
        <button onClick={() => onClearGroup(chars)} disabled={!cnt} style={inlineLinkBtn(!cnt)}>Clear</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))", gap: 5 }}>
        {chars.map(ch => {
          const sel = selected.has(ch)
          return (
            <button key={ch} onClick={() => onToggle(ch)}
              title={`U+${ch.codePointAt(0)?.toString(16).toUpperCase().padStart(4,"0")}`}
              style={{
                width: "100%", aspectRatio: "1",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontFamily: "'DM Mono','Courier New',monospace",
                borderRadius: 7, cursor: "pointer", transition: "all 0.1s",
                border: `1.5px solid ${sel ? "#2C2416" : "#E0DAD0"}`,
                background: sel ? "#2C2416" : "#FDFAF5",
                color: sel ? "#FBF9F5" : "#6B5E45",
              }}
              onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor="#A09880"; e.currentTarget.style.color="#3C3628" } }}
              onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor="#E0DAD0"; e.currentTarget.style.color="#6B5E45" } }}
            >{ch}</button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TemplateGrid() {
  const [selected, setSelected] = useState(() => new Set())
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated]   = useState(false)

  const selectedCount = ALL_CHARS.filter(ch => selected.has(ch)).length
  const allSelected   = selectedCount === ALL_CHARS.length

  const toggle      = ch    => setSelected(p => { const n=new Set(p); n.has(ch)?n.delete(ch):n.add(ch); return n })
  const addChars    = chars => setSelected(p => { const n=new Set(p); chars.forEach(c=>n.add(c)); return n })
  const removeChars = chars => setSelected(p => { const n=new Set(p); chars.forEach(c=>n.delete(c)); return n })
  const selectAll   = chars => setSelected(new Set(chars))
  const clearAll    = ()    => setSelected(new Set())

  const handleGenerate = async () => {
    if (!selected.size) return
    setGenerating(true)
    try { await generateTemplatePdf([...selected]); setGenerated(true) }
    finally { setGenerating(false) }
  }

  const handleGenerateByGroup = async () => {
    if (!selected.size) return
    setGenerating(true)
    try { await generateTemplatePdfByGroup(selected, GROUPS); setGenerated(true) }
    finally { setGenerating(false) }
  }

  const canPrint = selected.size > 0 && !generating

  return (
    <div className="fade-up">

      <p style={{ fontSize: 12, color: "#9E9278", marginBottom: 20, lineHeight: 1.6 }}>
        Optional — generate a template PDF to fill in by hand.{" "}
        <span style={{ color: "#B8A898" }}>Skip to Step 2 if you already have one.</span>
      </p>

      {generated && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#F0F5F1", border: "1px solid #C4D9CB",
          borderRadius: 10, padding: "10px 14px", marginBottom: 20,
        }}>
          <span style={{ fontSize: 13 }}>🗸</span>
          <p style={{ fontSize: 12, color: "#3A6B4A", margin: 0 }}>
            Sent to print — fill each cell, scan, then upload in Step 2.
          </p>
        </div>
      )}

      {/* ── Action bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24, gap: 12, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 12, color: "#9E9278" }}>
          {selectedCount > 0
            ? <><strong style={{ color: "#3C3628", fontWeight: 600 }}>{selectedCount}</strong> selected</>
            : "None selected"}
        </span>

        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>

          {/* ── Select All | Clear grouped pill ── */}
          <div style={{
            display: "flex", border: "1px solid #D9D3C8",
            borderRadius: 9, overflow: "hidden", background: "#FAF8F5",
          }}>
            <button
              onClick={() => selectAll(ALL_CHARS)} disabled={allSelected}
              style={{
                padding: "6px 14px", fontSize: 12, fontWeight: 500,
                color: allSelected ? "#C2B9AC" : "#3D3529",
                background: "transparent", border: "none",
                borderRight: "1px solid #D9D3C8",
                cursor: allSelected ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "background 0.12s",
              }}
              onMouseOver={e => { if (!allSelected) e.currentTarget.style.background = "#EEE9E1" }}
              onMouseOut={e => { e.currentTarget.style.background = "transparent" }}
            >Select All</button>
            <button
              onClick={clearAll} disabled={!selectedCount}
              style={{
                padding: "6px 14px", fontSize: 12, fontWeight: 500,
                color: !selectedCount ? "#C2B9AC" : "#3D3529",
                background: "transparent", border: "none",
                cursor: !selectedCount ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "background 0.12s",
              }}
              onMouseOver={e => { if (selectedCount) e.currentTarget.style.background = "#EEE9E1" }}
              onMouseOut={e => { e.currentTarget.style.background = "transparent" }}
            >Clear</button>
          </div>

          {/* ── Print template (filled dark) ── */}
          <button
            onClick={handleGenerateByGroup} disabled={!canPrint}
            title="Each group gets its own QR — merge scans freely"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", fontSize: 12, fontWeight: 600,
              color: canPrint ? "#FBF9F5" : "#A09880",
              background: canPrint ? "#2C2416" : "#E8E4DC",
              border: "none", borderRadius: 9,
              cursor: canPrint ? "pointer" : "not-allowed",
              fontFamily: "'DM Sans', sans-serif",
              transition: "background 0.15s",
            }}
            onMouseOver={e => { if (canPrint) e.currentTarget.style.background = "#3E3520" }}
            onMouseOut={e => { if (canPrint) e.currentTarget.style.background = "#2C2416" }}
          >
            {generating ? <><SpinIcon /> Generating…</> : "Print template"}
          </button>


        </div>
      </div>

      {/* ── Character groups ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {GROUPS.map(g => (
          <MinimalGroup
            key={g.label} label={g.label} chars={g.chars}
            selected={selected} onToggle={toggle}
            onSelectGroup={addChars} onClearGroup={removeChars}
          />
        ))}
      </div>
    </div>
  )
}