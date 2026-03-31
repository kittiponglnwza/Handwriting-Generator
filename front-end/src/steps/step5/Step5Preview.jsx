/**
 * Step5Preview — updated to remove sourceChars dependency.
 * Status bar now shows actual glyph count (data-driven), not Step 1 char selection count.
 *
 * Changed prop:
 *   REMOVED: sourceChars (was templateChars ?? selected — both eliminated)
 *   ADDED:   glyphCount  (extractedGlyphs.length — actual data-driven count)
 */
export default function Step5Preview({
  hasFileGlyphs,
  marginPx,
  text,
  setText,
  setEditNonce,
  tokens,
  renderToken,
  outputOffsetX,
  fontSize,
  lineHeight,
  textColor,
  alignment,
  previewZoom,
  setPreviewZoom,
  usingVersioned,
  versionedGlyphs,
  extractedGlyphs,
  glyphCount,        // ← replaces sourceChars
  documentSeed,
  dnaNonce,
}) {
  return (
    <>
      {/* Ruler */}
      <div style={{ height:22, background:"linear-gradient(to bottom,#faf9f8,#edebe9)", borderBottom:"1px solid #d2d0ce", display:"flex", alignItems:"flex-end", paddingLeft:Math.min(marginPx,80), paddingRight:Math.min(marginPx,80), flexShrink:0 }}>
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} style={{ flex:1, height:i%5===0?10:5, borderLeft:`1px solid ${i%5===0?"#a19f9d":"#d2d0ce"}` }} />
        ))}
      </div>

      {!hasFileGlyphs && (
        <div style={{ margin:"6px 8px 0", background:"#fff4ce", border:"1px solid #f1c40f", borderRadius:4, padding:"6px 10px", fontSize:12, color:"#605e5c" }}>
          ยังไม่มี glyph จาก Step 3 — จะแสดงเป็นตัวอักษรธรรมดา
        </div>
      )}

      <div style={{ flex:1, display:"flex", flexDirection:"row", gap:8, padding:"6px 8px 8px", minHeight:0, alignItems:"stretch" }}>
        {/* Left panel — text input */}
        <div style={{ flex:"0 1 42%", minWidth:260, maxWidth:480, display:"flex", flexDirection:"column", gap:6 }}>
          <div style={{ background:"#ffffff", border:"1px solid #d2d0ce", borderRadius:6, boxShadow:"0 1px 3px rgba(0,0,0,.06)", flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#605e5c", padding:"8px 12px", borderBottom:"1px solid #d2d0ce", background:"#faf9f8", letterSpacing:"0.02em" }}>
              ข้อความต้นฉบับ
            </div>
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setEditNonce(n => n + 1) }}
              placeholder="พิมพ์ที่นี่ — ฝั่งขวาจะแสดงลายมือ"
              style={{ flex:1, width:"100%", boxSizing:"border-box", border:"none", padding:"10px 12px", fontSize:14, lineHeight:1.45, resize:"none", outline:"none", fontFamily:"'Segoe UI','DM Sans',system-ui,sans-serif", minHeight:280, background:"#fff", color:"#323130" }}
            />
          </div>
          <p style={{ fontSize:10, color:"#605e5c", margin:0, lineHeight:1.45 }}>
            PDF: กด Export PDF → เลือก "Microsoft Print to PDF"
            <br />
            <span style={{ color:"#0078d4" }}>ถ้ามีวันที่/หัวข้อมุมกระดาษ: เปิด "More settings" แล้วปิด "Headers and footers"</span>
          </p>
        </div>

        {/* Right panel — preview */}
        <div style={{ flex:1, minWidth:0, background:"#2d2c2c", borderRadius:6, border:"1px solid #1a1a1a", boxShadow:"inset 0 0 0 1px rgba(255,255,255,.04)", overflowY:"scroll", overflowX:"hidden", position:"relative", display:"flex", justifyContent:"center", alignItems:"flex-start", padding:"12px 10px 16px" }}>
          {/* Zoom controls */}
          <div style={{ position:"absolute", top:8, right:10, zIndex:5, display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.92)", border:"1px solid #d2d0ce", borderRadius:10, padding:"6px 8px" }}>
            <button type="button" onClick={() => setPreviewZoom(z => Math.max(0.7, +(z-0.1).toFixed(2)))} style={{ width:26, height:26, borderRadius:8, border:"1px solid #d2d0ce", background:"#fff", cursor:"pointer", fontSize:14, color:"#323130" }} aria-label="Zoom out">-</button>
            <span style={{ fontSize:12, color:"#605e5c", minWidth:52, textAlign:"center" }}>{Math.round(previewZoom*100)}%</span>
            <button type="button" onClick={() => setPreviewZoom(z => Math.min(1.6, +(z+0.1).toFixed(2)))} style={{ width:26, height:26, borderRadius:8, border:"1px solid #d2d0ce", background:"#fff", cursor:"pointer", fontSize:14, color:"#323130" }} aria-label="Zoom in">+</button>
          </div>

          {/* Paper */}
          <div style={{ width:"100%", maxWidth:595, minHeight:842*previewZoom, position:"relative" }}>
            <div style={{ width:"100%", maxWidth:595, minHeight:842, background:"#ffffff", boxShadow:"0 4px 24px rgba(0,0,0,.45),0 0 0 1px rgba(0,0,0,.12)", padding:`${marginPx}px`, boxSizing:"border-box", transform:`scale(${previewZoom})`, transformOrigin:"top center" }}>
              <div style={{ transform:`translateX(${outputOffsetX}px)`, transformOrigin:"top left", fontSize, lineHeight, color:textColor, textAlign:alignment, width:"100%", maxWidth:"100%", boxSizing:"border-box", minHeight:640, wordBreak:"break-word", overflowWrap:"anywhere", overflowX:"hidden", WebkitFontSmoothing:"antialiased", textRendering:"optimizeLegibility" }}>
                {tokens.length === 0
                  ? <span style={{ opacity:0.35, color:"#605e5c" }}>พิมพ์ฝั่งซ้ายเพื่อดูลายมือบนกระดาษ…</span>
                  : tokens.map(renderToken)
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar — data-driven counts, no Step 1 selection count */}
      <div style={{ height:26, flexShrink:0, background:"#f3f2f1", borderTop:"1px solid #d2d0ce", display:"flex", alignItems:"center", padding:"0 12px", fontSize:11, color:"#605e5c", gap:16 }}>
        <span>หน้า 1 จาก 1</span>
        <span>คำ: {text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0}</span>
        <span>แหล่งข้อมูล: {usingVersioned ? `versioned (${versionedGlyphs.length})` : `raw (${extractedGlyphs.length})`}</span>
        {/* 
          sourceChars REMOVED — was showing Step 1 selection count which is meaningless here.
          Now shows actual extracted glyph count from PDF.
        */}
        <span>glyphs ที่ extract: {glyphCount}</span>
        <span>seed {documentSeed}</span>
        <span>dna #{dnaNonce}</span>
        <div style={{ flex:1 }} />
        <span>100%</span>
      </div>
    </>
  )
}