import { useMemo, useState } from "react"
import Btn from "../components/Btn"
import InfoBox from "../components/InfoBox"
import C from "../styles/colors"

const SEED = "0x3b9e12f4"

function hashString(input) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24)
  }
  return hash >>> 0
}

function lerp(min, max, t) {
  return min + (max - min) * t
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function createRng(seedStr) {
  let t = (hashString(seedStr) || 1) >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function buildVariant(rng, ch, prevChar = "") {
  const version = 1 + Math.floor(rng() * 3)
  const sameAsPrev = prevChar === ch
  const widthScale = lerp(0.5, 0.7, rng())
  const kerning = clamp(lerp(-0.8, 1.8, rng()) + (sameAsPrev ? -0.9 : 0), -2.1, 2.2)

  return {
    version,
    rotate: lerp(-4.8, 4.8, rng()),
    skewX: lerp(-6, 6, rng()),
    scaleX: lerp(0.92, 1.08, rng()),
    scaleY: lerp(0.9, 1.08, rng()),
    shiftX: lerp(-1.6, 1.6, rng()),
    shiftY: lerp(-6.2, 4.8, rng()),
    widthScale,
    kerning,
  }
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function dataUrlToBinary(dataUrl) {
  const parts = String(dataUrl || "").split(",")
  if (parts.length < 2) return ""
  return atob(parts[1])
}

function binaryToBase64(binary) {
  return btoa(binary)
}

function normalizePngDataUrl(dataUrl) {
  if (!dataUrl?.startsWith("data:image/png")) return ""
  const binary = dataUrlToBinary(dataUrl)
  if (!binary) return ""
  return `data:image/png;base64,${binaryToBase64(binary)}`
}

export default function Step5({ selected, templateChars = [], extractedGlyphs = [] }) {
  const [text, setText] = useState("สวัสดีครับ นี่คือเอกสาร Word จากลายมือเรา 123")
  const [fontSize, setFontSize] = useState(38)
  const [lineHeight, setLineHeight] = useState(1.95)
  const [dnaNonce, setDnaNonce] = useState(0)

  const sourceChars = useMemo(
    () => (templateChars.length > 0 ? templateChars : [...selected]),
    [selected, templateChars]
  )

  const glyphMap = useMemo(() => {
    const m = new Map()
    for (const g of extractedGlyphs) {
      const key = String(g.ch || "")
      if (!key) continue
      if (!m.has(key)) m.set(key, [])
      m.get(key).push(g)
    }
    return m
  }, [extractedGlyphs])

  const hasFileGlyphs = extractedGlyphs.length > 0

  const tokens = useMemo(() => {
    const list = []
    const chars = Array.from(text || "")
    const rng = createRng(`${SEED}-${dnaNonce}-${text}`)
    let prevChar = ""

    for (let i = 0; i < chars.length; i += 1) {
      const ch = chars[i]

      if (ch === "\n") {
        list.push({ type: "newline", id: `n-${i}` })
        prevChar = ""
        continue
      }
      if (ch === " ") {
        list.push({ type: "space", id: `s-${i}` })
        prevChar = ""
        continue
      }

      const candidates = glyphMap.get(ch) || []
      const pickIdx = candidates.length > 0 ? Math.floor(rng() * candidates.length) : -1
      const glyph = pickIdx >= 0 ? candidates[pickIdx] : null

      const variant = buildVariant(rng, ch, prevChar)

      list.push({
        type: "char",
        id: `c-${i}`,
        ch,
        version: variant.version,
        variant,
        glyph,
        preview: glyph ? normalizePngDataUrl(glyph.previewInk || glyph.preview || "") : "",
      })
      prevChar = ch
    }

    return list
  }, [text, glyphMap, dnaNonce])

  const linePx = fontSize * lineHeight

  const exportWord = () => {
    const htmlPieces = []

    for (const token of tokens) {
      if (token.type === "newline") {
        htmlPieces.push("<br />")
        continue
      }
      if (token.type === "space") {
        htmlPieces.push('<span class="sp">&nbsp;</span>')
        continue
      }

      const t = token.variant
      const transform = `translate(${t.shiftX.toFixed(2)}px, ${t.shiftY.toFixed(2)}px) rotate(${t.rotate.toFixed(2)}deg) skewX(${t.skewX.toFixed(2)}deg) scale(${t.scaleX.toFixed(3)}, ${t.scaleY.toFixed(3)})`
      const spacing = `${t.kerning.toFixed(2)}px`
      const glyphWidth = `${(fontSize * t.widthScale).toFixed(2)}px`

      if (token.preview) {
        htmlPieces.push(
          `<span class="glyph" style="margin-right:${spacing};width:${glyphWidth};"><img src="${token.preview}" alt="${escapeHtml(token.ch)}" style="transform:${transform};" /></span>`
        )
      } else {
        htmlPieces.push(
          `<span class="fallback" style="margin-right:${spacing};transform:${transform};">${escapeHtml(token.ch)}</span>`
        )
      }
    }

    const docHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Handwriting Word Export</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body {
              font-family: "TH Sarabun New", "Noto Sans Thai", "Tahoma", sans-serif;
              background: #ffffff;
              color: #2c2416;
              margin: 0;
            }
            .meta { font-size: 11pt; color: #74684f; margin-bottom: 12pt; }
            .paper {
              min-height: 760px;
              padding: 18px 16px;
              border: 1px solid #e2dbcb;
              border-radius: 12px;
              background-image: repeating-linear-gradient(
                to bottom,
                transparent 0,
                transparent ${(linePx - 1).toFixed(2)}px,
                #e4dcc8 ${(linePx - 1).toFixed(2)}px,
                #e4dcc8 ${linePx.toFixed(2)}px
              );
              line-height: ${lineHeight};
              font-size: ${fontSize}px;
            }
            .glyph {
              display: inline-flex;
              align-items: flex-end;
              vertical-align: baseline;
              height: ${Math.round(fontSize * 1.32)}px;
            }
            .glyph img {
              width: ${Math.round(fontSize * 0.9)}px;
              height: ${Math.round(fontSize * 1.05)}px;
              object-fit: contain;
              transform-origin: center;
              image-rendering: auto;
            }
            .fallback {
              display: inline-block;
              vertical-align: baseline;
              transform-origin: center;
            }
            .sp { display: inline-block; width: ${Math.max(4, Math.round(fontSize * 0.16))}px; }
          </style>
        </head>
        <body>
          <div class="meta">Generated from DNA random variants • seed ${SEED} • nonce ${dnaNonce}</div>
          <div class="paper">${htmlPieces.join("")}</div>
        </body>
      </html>
    `

    const blob = new Blob(["\ufeff", docHtml], { type: "application/msword;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const stamp = new Date().toISOString().replaceAll(":", "-").slice(0, 19)
    a.href = url
    a.download = `handwriting-dna-${stamp}.doc`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  return (
    <div className="fade-up">
      {!hasFileGlyphs && (
        <InfoBox color="amber">
          ยังไม่พบ glyph จาก Step 3 ระบบจะแสดงเป็นข้อความธรรมดาก่อน กรุณากลับไป Step 3 เพื่อดึงลายมือจากไฟล์
        </InfoBox>
      )}

      <div
        style={{
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "12px 14px",
          marginBottom: 12,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 12, color: C.inkMd }}>
          Source glyphs: <b style={{ color: C.ink }}>{extractedGlyphs.length}</b>
          {sourceChars.length > 0 ? ` • Step1 set ${sourceChars.length}` : ""}
        </span>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 11, color: C.inkLt }}>
            ขนาด
            <input
              type="number"
              min={24}
              max={64}
              value={fontSize}
              onChange={e => setFontSize(Number(e.target.value) || 38)}
              style={{ width: 70, marginLeft: 6, border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 6px", fontSize: 11 }}
            />
          </label>
          <label style={{ fontSize: 11, color: C.inkLt }}>
            บรรทัด
            <input
              type="number"
              min={1.4}
              max={2.6}
              step={0.05}
              value={lineHeight}
              onChange={e => setLineHeight(Number(e.target.value) || 1.95)}
              style={{ width: 70, marginLeft: 6, border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 6px", fontSize: 11 }}
            />
          </label>
          <Btn onClick={() => setDnaNonce(n => n + 1)} variant="ghost" size="sm">
            สุ่ม DNA ver ใหม่
          </Btn>
          <Btn onClick={exportWord} variant="primary" size="sm" disabled={!text.trim()}>
            Export Word (.doc)
          </Btn>
        </div>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
        placeholder="พิมพ์ข้อความที่ต้องการ แล้วระบบจะสุ่ม ver 1/2/3 ต่ออักษรตาม DNA"
        style={{
          width: "100%",
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "12px 14px",
          fontSize: 14,
          resize: "vertical",
          background: C.bgCard,
          color: C.ink,
          outline: "none",
          marginBottom: 14,
          fontFamily: "'DM Sans', sans-serif",
        }}
      />

      <div
        style={{
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: "16px 14px",
        }}
      >
        <p style={{ fontSize: 11, color: C.inkLt, marginBottom: 8 }}>
          Word Preview • seed {SEED} • nonce {dnaNonce}
        </p>

        <div
          style={{
            minHeight: 420,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            backgroundColor: "#fff",
            padding: "18px 14px",
            lineHeight,
            fontSize,
            color: C.ink,
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${linePx - 1}px, #E4DCC8 ${linePx - 1}px, #E4DCC8 ${linePx}px)`,
            overflowWrap: "anywhere",
          }}
        >
          {tokens.length === 0 ? (
            <span style={{ opacity: 0.45 }}>พิมพ์ข้อความเพื่อเริ่มพรีวิว...</span>
          ) : (
            tokens.map(token => {
              if (token.type === "newline") {
                return <br key={token.id} />
              }
              if (token.type === "space") {
                return <span key={token.id} style={{ display: "inline-block", width: Math.max(4, fontSize * 0.16) }} />
              }

              const t = token.variant
              const commonStyle = {
                transform: `translate(${t.shiftX}px, ${t.shiftY}px) rotate(${t.rotate}deg) skewX(${t.skewX}deg) scale(${t.scaleX}, ${t.scaleY})`,
                transformOrigin: "center",
                marginRight: t.kerning,
                verticalAlign: "baseline",
              }

              if (token.preview) {
                return (
                  <span
                    key={token.id}
                    title={`${token.ch} • ver ${token.version}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      width: fontSize * t.widthScale,
                      height: fontSize * 1.32,
                      ...commonStyle,
                    }}
                  >
                    <img
                      src={token.preview}
                      alt={token.ch}
                      style={{
                        width: fontSize * 0.9,
                        height: fontSize * 1.05,
                        objectFit: "contain",
                        imageRendering: "auto",
                      }}
                    />
                  </span>
                )
              }

              return (
                <span
                  key={token.id}
                  title={`${token.ch} • ver ${token.version}`}
                  style={{ display: "inline-block", ...commonStyle }}
                >
                  {token.ch}
                </span>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
