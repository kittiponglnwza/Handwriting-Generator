/**
 * Step1 — Template Generator
 *
 * ARCHITECTURE ROLE: Optional, isolated tool.
 * - Zero props received from App.jsx
 * - Zero app state written on completion
 * - Calls generateTemplatePdf() which is a pure side-effect (opens print window)
 * - Characters selected here NEVER flow to Step 3, Step 4, or Step 5
 *
 * If a user skips this step entirely, the rest of the workflow is unaffected.
 */
import { useState } from "react"
import Group from "../components/Group"
import InfoBox from "../components/InfoBox"
import Btn from "../components/Btn"

// ─── Character sets ───────────────────────────────────────────────────────────
const THAI_CONSONANTS =
  "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ".split("")
const THAI_VOWELS = [
  "ะ","ั","า","ำ","ิ","ี","ึ","ื","ุ","ู",
  "เ","แ","โ","ใ","ไ","ๅ","ฤ","ฤๅ","ฦ","ฦๅ","็",
]
const THAI_TONE_MARKS = ["่","้","๊","๋"]  // ไม้เอก ไม้โท ไม้ตรี ไม้จัตวา
const DIGITS = "0123456789".split("")
const ENG_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
const ENG_LOWER = "abcdefghijklmnopqrstuvwxyz".split("")
const SPECIAL_CHARS = [
  "!","@","#","$","%","^","&","*","(",")","-","_","=","+",
  "[","]","{","}",";",":","'",'"',",",".","<",">","/","?","\\","|","`","~",
]

const GROUPS = [
  { label: "Thai Consonants", chars: THAI_CONSONANTS },
  { label: "Thai Vowels",     chars: THAI_VOWELS },
  { label: "Tone Marks",      chars: THAI_TONE_MARKS },
  { label: "Digits",          chars: DIGITS },
  { label: "English A-Z", chars: ENG_UPPER },
  { label: "English a-z", chars: ENG_LOWER },
  { label: "Special Chars",   chars: SPECIAL_CHARS },
]

const ALL_CHARS = GROUPS.flatMap(g => g.chars)

// ─── QR helpers (moved here from App.jsx — they only serve Step 1) ────────────
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
    // Try auto-detect first (typeNumber=0), then explicit sizes if it fails.
    // qrcode-generator throws when typeNumber=0 can't fit the data — catch and retry.
    let qr = null
    for (const typeNum of [0, 10, 15, 20, 25, 30, 40]) {
      try {
        qr = window.qrcode(typeNum, "M")
        qr.addData(text, "Byte")
        qr.make()
        break
      } catch {
        qr = null
      }
    }
    if (!qr) return null
    const size = qr.getModuleCount()
    const scale = 4
    const dim = size * scale
    const canvas = document.createElement("canvas")
    canvas.width = dim; canvas.height = dim
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, dim, dim)
    ctx.fillStyle = "#000000"
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (qr.isDark(r, c)) ctx.fillRect(c * scale, r * scale, scale, scale)
    return canvas.toDataURL("image/png")
  } catch (e) {
    console.warn("QR generation failed:", e)
    return null
  }
}

const escapeHtml = text =>
  text.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;")

// For HGCHAR tags: encode Thai combining chars (vowels/tone marks U+0E30–U+0E4E)
// as numeric character references so pdfjs text extraction cannot lose or split them.
// e.g. "่" → "&#x0E48;" — pdfjs decodes NCRs back to the real char when reading text layer.
// Multi-codepoint chars (e.g. ฤๅ = U+0E24 + U+0E45) are encoded codepoint-by-codepoint.
const escapeHgChar = ch => {
  if (!ch) return ""
  // Encode every codepoint in Thai block (U+0E00–U+0E7F) as NCR to survive pdfjs
  return [...ch].map(c => {
    const cp = c.codePointAt(0)
    if (cp >= 0x0E00 && cp <= 0x0E7F)
      return `&#x${cp.toString(16).toUpperCase().padStart(4,"0")};`
    return escapeHtml(c)
  }).join("")
}

const encodeHgQrCharsPayload = charsOnPage => {
  const json = JSON.stringify(charsOnPage)
  const bytes = new TextEncoder().encode(json)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

// ─── Multi-group PDF generator ────────────────────────────────────────────────
// สร้าง PDF เดียวที่มีหลาย segment แต่ละ group มี QR ของตัวเอง
// วิธีนี้ทำให้ Step 2 อ่าน QR ได้ถูกต้องแม้จะพิมพ์รวมกันแล้ว scan กลับ
async function generateTemplatePdfByGroup(selectedSet, groups) {
  // กรองเฉพาะ group ที่มี selected chars
  const activeGroups = groups
    .map(g => ({ label: g.label, chars: g.chars.filter(ch => selectedSet.has(ch)) }))
    .filter(g => g.chars.length > 0)
  if (activeGroups.length === 0) return

  const COLUMNS_PER_ROW = 6
  const ROWS_PER_PAGE = 6
  const CELLS_PER_PAGE = COLUMNS_PER_ROW * ROWS_PER_PAGE

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

  const allSheets = []

  for (const group of activeGroups) {
    const chars = group.chars
    const pageCount = Math.ceil(chars.length / CELLS_PER_PAGE)

    const groupSheets = await Promise.all(
      Array.from({ length: pageCount }, async (_, pageIndex) => {
        const pageStart = pageIndex * CELLS_PER_PAGE
        const pageChars = chars.slice(pageStart, pageStart + CELLS_PER_PAGE)
        const pageCellCount = pageChars.length
        const cellFrom = pageStart + 1
        const cellTo   = pageStart + pageCellCount
        const rows = []

        for (let rowStart = 0; rowStart < pageChars.length; rowStart += COLUMNS_PER_ROW) {
          const rowChars = pageChars.slice(rowStart, rowStart + COLUMNS_PER_ROW)
          const cells = rowChars.map((ch, idx) => makeCell(ch, pageStart + rowStart + idx)).join("")
          rows.push(`<div class="row">${cells}</div>`)
        }

        let qrPayload = `HG:p=${pageIndex+1}/${pageCount},c=${cellFrom}-${cellTo},n=${pageCellCount},t=${chars.length},j=${encodeHgQrCharsPayload(pageChars)}`
        let qrDataUrl = await makeQrDataUrl(qrPayload)
        if (!qrDataUrl || qrPayload.length > 2300) {
          qrPayload = `HG:p=${pageIndex+1}/${pageCount},c=${cellFrom}-${cellTo},n=${pageCellCount},t=${chars.length}`
          qrDataUrl = await makeQrDataUrl(qrPayload)
        }
        const qrImg = qrDataUrl
          ? `<img src="${qrDataUrl}" class="page-qr" title="${qrPayload}" />`
          : `<span class="page-qr-fallback">${qrPayload}</span>`

        const header = `
          <div class="header">
            <h1 class="title">Handwriting Generator — ${escapeHtml(group.label)}</h1>
            <p class="meta">Group: ${escapeHtml(group.label)} • ${chars.length} characters • Page ${pageIndex+1}/${pageCount} • Cells ${cellFrom}–${cellTo}</p>
            <p class="meta">Cell code: HGxxx (used for position anchoring when uploading in Step 3)</p>
            ${qrImg}
          </div>`

        const metaTag = `<p style="font-size:1px;color:transparent;user-select:none">HGMETA:page=${pageIndex+1},totalPages=${pageCount},from=${cellFrom},to=${cellTo},count=${pageCellCount},total=${chars.length},j=${encodeHgQrCharsPayload(pageChars)}</p>`

        return `<section class="sheet">${header}<div class="grid">${rows.join("")}</div><p class="footer">${escapeHtml(group.label)} • ${pageIndex+1}/${pageCount}</p>${metaTag}</section>`
      })
    )
    allSheets.push(...groupSheets)
  }

  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"/><title>Handwriting Template</title>
    <style>
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
      .sheet:last-of-type{break-after:auto;page-break-after:auto}
    </style></head><body>
    ${allSheets.join("")}
    <script>
      window.addEventListener("load",()=>{
        const run=()=>setTimeout(()=>window.print(),220)
        if(document.fonts&&document.fonts.ready){document.fonts.ready.then(run)}else{run()}
      })
    </script></body></html>`

  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, "_blank")
  if (!win) { window.alert("Could not open print window — please allow pop-ups and try again."); return }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

// ─── Template PDF generator (self-contained, no app state touched) ────────────
async function generateTemplatePdf(chars) {
  if (chars.length === 0) return

  const COLUMNS_PER_ROW = 6
  const ROWS_PER_PAGE = 6
  const CELLS_PER_PAGE = COLUMNS_PER_ROW * ROWS_PER_PAGE
  const pageCount = Math.ceil(chars.length / CELLS_PER_PAGE)

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

  const sheetArray = await Promise.all(
    Array.from({ length: pageCount }, async (_, pageIndex) => {
      const pageStart = pageIndex * CELLS_PER_PAGE
      const pageChars = chars.slice(pageStart, pageStart + CELLS_PER_PAGE)
      const pageCellCount = pageChars.length
      const cellFrom = pageStart + 1
      const cellTo   = pageStart + pageCellCount
      const rows = []

      for (let rowStart = 0; rowStart < pageChars.length; rowStart += COLUMNS_PER_ROW) {
        const rowChars = pageChars.slice(rowStart, rowStart + COLUMNS_PER_ROW)
        const rowAbsoluteStart = pageStart + rowStart
        const cells = rowChars.map((ch, idx) => makeCell(ch, rowAbsoluteStart + idx)).join("")
        rows.push(`<div class="row">${cells}</div>`)
      }

      let qrPayload = `HG:p=${pageIndex+1}/${pageCount},c=${cellFrom}-${cellTo},n=${pageCellCount},t=${chars.length},j=${encodeHgQrCharsPayload(pageChars)}`
      let qrDataUrl = await makeQrDataUrl(qrPayload)
      if (!qrDataUrl || qrPayload.length > 2300) {
        qrPayload = `HG:p=${pageIndex+1}/${pageCount},c=${cellFrom}-${cellTo},n=${pageCellCount},t=${chars.length}`
        qrDataUrl = await makeQrDataUrl(qrPayload)
      }
      const qrImg = qrDataUrl
        ? `<img src="${qrDataUrl}" class="page-qr" title="${qrPayload}" />`
        : `<span class="page-qr-fallback">${qrPayload}</span>`

      const header = `
        <div class="header">
          <h1 class="title">Handwriting Generator Template</h1>
          <p class="meta">Total glyphs: ${chars.length} • Page ${pageIndex+1}/${pageCount} • Cells ${cellFrom}–${cellTo} (${pageCellCount} cells)</p>
          <p class="meta">Cell code format: HGxxx (used for position anchoring when uploading in Step 3)</p>
          ${qrImg}
        </div>`

      const metaTag = `<p style="font-size:1px;color:transparent;user-select:none">HGMETA:page=${pageIndex+1},totalPages=${pageCount},from=${cellFrom},to=${cellTo},count=${pageCellCount},total=${chars.length},j=${encodeHgQrCharsPayload(pageChars)}</p>`

      return `<section class="sheet">${header}<div class="grid">${rows.join("")}</div><p class="footer">Practice sheet • Trace over the dotted shape • ${pageIndex+1}/${pageCount}</p>${metaTag}</section>`
    })
  )

  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"/><title>Handwriting Template</title>
    <style>
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
      .sheet:last-of-type{break-after:auto;page-break-after:auto}
    </style></head><body>
    ${sheetArray.join("")}
    <script>
      window.addEventListener("load",()=>{
        const run=()=>setTimeout(()=>window.print(),220)
        if(document.fonts&&document.fonts.ready){document.fonts.ready.then(run)}else{run()}
      })
    </script></body></html>`

  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, "_blank")
  if (!win) { window.alert("Could not open print window — please allow pop-ups and try again."); return }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Step1() {
  // Local state only — never leaks to App.jsx
  const [selected, setSelected] = useState(() => new Set())
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated]   = useState(false)

  const selectedCount = [...ALL_CHARS].filter(ch => selected.has(ch)).length
  const allSelected   = selectedCount === ALL_CHARS.length

  const toggle = ch => setSelected(prev => {
    const next = new Set(prev)
    next.has(ch) ? next.delete(ch) : next.add(ch)
    return next
  })
  const addChars    = chars => setSelected(prev => { const n = new Set(prev); chars.forEach(c => n.add(c)); return n })
  const removeChars = chars => setSelected(prev => { const n = new Set(prev); chars.forEach(c => n.delete(c)); return n })
  const selectAll   = chars => setSelected(new Set(chars))
  const clearAll    = ()    => setSelected(new Set())

  const handleGenerate = async () => {
    if (selected.size === 0) return
    setGenerating(true)
    try {
      await generateTemplatePdf([...selected])
      setGenerated(true)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateByGroup = async () => {
    if (selected.size === 0) return
    setGenerating(true)
    try {
      await generateTemplatePdfByGroup(selected, GROUPS)
      setGenerated(true)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fade-up">
      <InfoBox color="amber">
        This step is optional — use it to generate a new handwriting template.
        If you already have a PDF, go to Step 2 directly.
      </InfoBox>

      {generated && (
        <InfoBox color="sage">
          ✅ Template sent to print — fill in each cell with your handwriting, scan as one file,
          then upload in Step 2. (⭐ button: each group has its own QR, works even when merged)
        </InfoBox>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <p style={{ fontSize: 12, color: "#9E9278" }}>
          {selectedCount > 0 ? `Selected ${selectedCount} characters` : "None selected"}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn onClick={() => selectAll(ALL_CHARS)} variant="sage" size="sm" disabled={allSelected}>
            Select All
          </Btn>
          <Btn onClick={clearAll} variant="ghost" size="sm" disabled={selectedCount === 0}>
            Clear All
          </Btn>
          <Btn
            onClick={handleGenerateByGroup}
            variant="primary"
            size="sm"
            disabled={selected.size === 0 || generating}
            title="Recommended: each group has its own QR — merge files freely"
          >
            {generating ? "Generating…" : "⭐ Print by Group (recommended)"}
          </Btn>
          <Btn
            onClick={handleGenerate}
            variant="ghost"
            size="sm"
            disabled={selected.size === 0 || generating}
            title="Print all characters in one batch — use the left button if merging scans"
          >
            Print All Together
          </Btn>
        </div>
      </div>

      {GROUPS.map(group => (
        <Group
          key={group.label}
          label={group.label}
          chars={group.chars}
          selected={selected}
          onToggle={toggle}
          onSelectGroup={addChars}
          onSelectOnlyGroup={selectAll}
          onClearGroup={removeChars}
        />
      ))}
    </div>
  )
}