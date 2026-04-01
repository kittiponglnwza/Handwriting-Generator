/**
 * OPTIMIZED STEP 3 COMPONENT
 * 
 * Fixes identified performance and geometry issues:
 * - Uses fixed glyph pipeline with corrected geometry
 * - Implements memoized glyph cards
 * - Adds Web Worker for SVG tracing
 * - Optimizes state management and re-renders
 */

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import Btn from "../components/Btn"
import InfoBox from "../components/InfoBox"
import GlyphCard from "../components/GlyphCard"
import C from "../styles/colors"
import { buildAutoPageProfiles } from "../lib/step3/calibration.js"
import {
  GRID_COLS,
  MIN_TRUSTED_INDEX_TARGETS,
  TEMPLATE_CALIBRATION,
  ZERO_CALIBRATION,
} from "../lib/step3/constants.js"
import {
  extractGlyphsFromCanvas,
  getGridGeometry,
  getPageCapacity,
  traceAllGlyphs,
} from "../lib/step3/glyphPipeline_fixed.js" // Use fixed version
import { buildOrderedCellRectsForPage } from "../lib/step3/regDots.js"
import { mergeCalibration } from "../lib/step3/utils.js"
import { Adjuster, GridDebugOverlay } from "./step3/Step3Panels.jsx"
import tracingWorkerManager from "../lib/step3/tracingWorkerManager.js"

// Debounce utility for calibration updates
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export default function Step3Optimized({ parsedFile, onGlyphsUpdate = () => {} }) {
  // ── State management (optimized) ────────────────────────────────────────────────
  const chars = parsedFile?.characters ?? []

  const [pageVersion, setPageVersion] = useState(0)
  const [error, setError] = useState("")
  const [activeId, setActiveId] = useState(null)
  const [zoomGlyph, setZoomGlyph] = useState(null)
  const [removedIds, setRemovedIds] = useState(() => new Set())
  const [calibration, setCalibration] = useState(ZERO_CALIBRATION)
  const [autoAligning, setAutoAligning] = useState(false)
  const [autoInfo, setAutoInfo] = useState("")
  const [showDebug, setShowDebug] = useState(false)
  const [tracedGlyphs, setTracedGlyphs] = useState([])
  const [tracing, setTracing] = useState(false)

  const pageRef = useRef(null)
  const workerInitialized = useRef(false)

  // ── Initialize Web Worker ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!workerInitialized.current) {
      tracingWorkerManager.initialize().then(() => {
        workerInitialized.current = true
      })
    }
  }, [])

  // ── Memoized handlers to prevent child re-renders ───────────────────────────────
  const handleGlyphActivate = useCallback((glyphId) => {
    setActiveId(prev => prev === glyphId ? null : glyphId)
  }, [])

  const handleGlyphRemove = useCallback((glyph) => {
    setRemovedIds(prev => { 
      const n = new Set(prev); 
      n.add(glyph.id); 
      return n 
    })
    if (activeId === glyph.id) setActiveId(null)
    if (zoomGlyph?.id === glyph.id) setZoomGlyph(null)
  }, [activeId, zoomGlyph])

  const handleGlyphZoom = useCallback((glyph) => {
    setZoomGlyph(glyph)
  }, [])

  // Debounced calibration update to reduce re-computation
  const debouncedSetCalibration = useCallback(
    debounce((newCalibration) => {
      setCalibration(newCalibration)
    }, 150),
    []
  )

  // ── Load page data (optimized) ───────────────────────────────────────────────────
  useEffect(() => {
    if (!parsedFile?.pages?.length) {
      pageRef.current = null
      setPageVersion(0)
      setError("")
      setActiveId(null)
      setZoomGlyph(null)
      setRemovedIds(new Set())
      setCalibration(ZERO_CALIBRATION)
      setAutoInfo("")
      return
    }

    try {
      const profiledPages = buildAutoPageProfiles(parsedFile.pages, chars)
      const avgScore = profiledPages.length > 0
        ? profiledPages.reduce((sum, p) => sum + (Number.isFinite(p.autoScore) ? p.autoScore : 0), 0) / profiledPages.length
        : NaN
      const anchorPages = profiledPages.filter(p => p.autoSource === "anchor").length
      const codeAnchorPages = profiledPages.filter(p => p.hasCodeAnchors).length

      pageRef.current = { pages: profiledPages, totalPages: profiledPages.length }
      setAutoInfo(
        Number.isFinite(avgScore)
          ? `Auto aligned ${profiledPages.length} pages (targets ${chars.length}, anchored ${anchorPages}, code ${codeAnchorPages}, avg score ${avgScore.toFixed(1)})`
          : `Auto aligned ${profiledPages.length} pages (anchored ${anchorPages}, code ${codeAnchorPages})`
      )
      setPageVersion(v => v + 1)
      setError("")
    } catch (err) {
      setError(err?.message ?? "เกิดข้อผิดพลาดในการโหลด glyphs")
    }
  }, [parsedFile, chars.length])

  // ── Auto-align (optimized) ───────────────────────────────────────────────────────
  const runAutoAlign = useCallback(() => {
    const store = pageRef.current
    if (!store?.pages?.length || chars.length === 0) return
    setAutoAligning(true)
    
    // Use requestIdleCallback for non-blocking
    const scheduleAlign = () => {
      setTimeout(() => {
        const pages = buildAutoPageProfiles(store.pages, chars)
        pageRef.current = { ...store, pages }
        const avgScore = pages.length > 0
          ? pages.reduce((sum, p) => sum + (Number.isFinite(p.autoScore) ? p.autoScore : 0), 0) / pages.length
          : NaN
        const anchorPages = pages.filter(p => p.autoSource === "anchor").length
        setAutoInfo(
          Number.isFinite(avgScore)
            ? `Auto aligned ${pages.length} pages (anchored ${anchorPages}, avg score ${avgScore.toFixed(1)})`
            : `Auto aligned ${pages.length} pages (anchored ${anchorPages})`
        )
        setPageVersion(v => v + 1)
        setAutoAligning(false)
      }, 0)
    }
    
    if (window.requestIdleCallback) {
      window.requestIdleCallback(scheduleAlign)
    } else {
      scheduleAlign()
    }
  }, [chars.length])

  // ── Glyph extraction (optimized with memoization) ────────────────────────────────
  const analysisResult = useMemo(() => {
    void pageVersion  // reactive on version bump
    const source = pageRef.current
    if (!source?.pages?.length || chars.length === 0) {
      return { glyphs: [], pageCharsCount: 0, maxCells: 0, pagesUsed: 0, totalPages: source?.pages?.length ?? 0 }
    }

    let cursor = 0, pagesUsed = 0, maxCells = 0
    const allGlyphs = []
    const usedIndices = new Set()

    // Track segment offset for multi-segment PDFs
    let segmentOffset = 0
    let prevTotalPages = null
    let prevSegmentEnd = 0

    for (const page of source.pages) {
      if (cursor >= chars.length) break

      // Detect segment boundary
      const curTotalPages = page.pageMeta?.totalPages ?? null
      if (prevTotalPages !== null && curTotalPages !== null && curTotalPages !== prevTotalPages) {
        segmentOffset = prevSegmentEnd
      }
      if (curTotalPages !== null) prevTotalPages = curTotalPages

      const baseCalibration = page.autoCalibration ?? TEMPLATE_CALIBRATION
      const pageCalibration = mergeCalibration(baseCalibration, calibration)

      const startIndex = page.pageMeta?.cellFrom > 0
        ? segmentOffset + page.pageMeta.cellFrom - 1
        : cursor

      const remainingChars = chars.length - startIndex

      let pageMaxCells
      if (page.pageMeta?.cellCount > 0) {
        pageMaxCells = Math.min(page.pageMeta.cellCount, remainingChars)
      } else {
        const geometry = getGridGeometry(
          page.pageWidth, page.pageHeight,
          Math.min(remainingChars, GRID_COLS * 6), pageCalibration
        )
        pageMaxCells = getPageCapacity(page.pageHeight, geometry.startY, geometry.cellSize, geometry.gap)
        if (page.contiguousCount >= MIN_TRUSTED_INDEX_TARGETS)
          pageMaxCells = Math.min(pageMaxCells, page.contiguousCount)
        pageMaxCells = Math.min(pageMaxCells, remainingChars)
      }
      pageMaxCells = Math.min(pageMaxCells, GRID_COLS * 6)
      if (pageMaxCells <= 0) continue

      const pageCellFrom = page.pageMeta?.cellFrom > 0 ? page.pageMeta.cellFrom : startIndex + 1
      const hasGridLines = (page.regDots?.length ?? 0) >= 4
      let pageCellRects = hasGridLines
        ? buildOrderedCellRectsForPage(page, pageCellFrom, pageMaxCells)
        : null
      if (pageCellRects) {
        pageCellRects = pageCellRects.map(r => ({
          ...r, x: r.x + calibration.offsetX, y: r.y + calibration.offsetY,
        }))
      }

      const pageChars = chars.slice(startIndex, startIndex + pageMaxCells)
      if (pageChars.length === 0) continue

      const rawPageGlyphs = extractGlyphsFromCanvas({
        ctx: page.ctx,
        pageWidth: page.pageWidth,
        pageHeight: page.pageHeight,
        chars: pageChars,
        calibration: pageCalibration,
        cellRects: pageCellRects,
      })

      const pageGlyphs = rawPageGlyphs.map((g, i) => ({
        ...g,
        id: `p${page.pageNumber}-${startIndex + i}-${g.ch}`,
        index: startIndex + i + 1,
        pageNumber: page.pageNumber,
      }))

      for (const glyph of pageGlyphs) {
        if (usedIndices.has(glyph.index)) continue
        usedIndices.add(glyph.index)
        allGlyphs.push(glyph)
      }
      cursor = Math.max(cursor, startIndex + pageChars.length)
      prevSegmentEnd = cursor
      pagesUsed += 1
      maxCells += pageMaxCells
    }

    allGlyphs.sort((a, b) => a.index - b.index)
    const glyphs = removedIds.size === 0 ? allGlyphs : allGlyphs.filter(g => !removedIds.has(g.id))
    return { glyphs, pageCharsCount: allGlyphs.length, maxCells, pagesUsed, totalPages: source.pages.length }
  }, [chars, pageVersion, calibration, removedIds])

  const glyphs = analysisResult.glyphs
  const isPartialRead = chars.length > analysisResult.pageCharsCount

  // ── Optimized SVG tracing with Web Worker ───────────────────────────────────────────
  useEffect(() => {
    if (glyphs.length === 0) { 
      setTracedGlyphs([]); 
      return 
    }
    
    let canceled = false
    setTracing(true)
    
    const traceGlyphs = async () => {
      try {
        if (workerInitialized.current && tracingWorkerManager.isInitialized) {
          // Use Web Worker for tracing
          const results = await tracingWorkerManager.traceGlyphBatch(glyphs)
          
          if (!canceled) {
            const tracedGlyphs = glyphs.map((glyph, index) => {
              const result = results.find(r => r.glyphId === glyph.id)
              return {
                ...glyph,
                svgPath: result?.result?.path || null,
                viewBox: result?.result?.viewBox || "0 0 100 100",
              }
            })
            setTracedGlyphs(tracedGlyphs)
          }
        } else {
          // Fallback to main thread
          const traced = await traceAllGlyphs(glyphs)
          if (!canceled) {
            setTracedGlyphs(traced)
          }
        }
      } catch (error) {
        console.error('SVG tracing failed:', error)
        if (!canceled) {
          setTracedGlyphs(glyphs.map(g => ({ ...g, svgPath: null, viewBox: "0 0 100 100" })))
        }
      } finally {
        if (!canceled) {
          setTracing(false)
        }
      }
    }
    
    // Use requestIdleCallback for non-blocking
    if (window.requestIdleCallback) {
      window.requestIdleCallback(traceGlyphs)
    } else {
      setTimeout(traceGlyphs, 0)
    }
    
    return () => { canceled = true }
  }, [glyphs])

  const displayGlyphs = tracedGlyphs.length > 0 ? tracedGlyphs : glyphs

  // ── Emit to App.jsx (optimized) ───────────────────────────────────────────────────
  useEffect(() => {
    onGlyphsUpdate(displayGlyphs)
  }, [displayGlyphs, onGlyphsUpdate])

  // ── Memoized calculations ───────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const ok = displayGlyphs.filter(g => g.status === "ok").length
    const missing = displayGlyphs.filter(g => g.status === "missing").length
    const overflow = displayGlyphs.filter(g => g.status === "overflow").length
    return { ok, missing, overflow, total: displayGlyphs.length }
  }, [displayGlyphs])

  const activeGlyph = useMemo(() => 
    displayGlyphs.find(g => g.id === activeId) ?? null, 
    [displayGlyphs, activeId]
  )

  // ── Memoized glyph grid component ─────────────────────────────────────────────────
  const GlyphGrid = useMemo(() => {
    if (displayGlyphs.length === 0) return null

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(88px,1fr))", gap: 8 }}>
        {displayGlyphs.map(g => (
          <GlyphCard
            key={g.id}
            glyph={g}
            isActive={activeId === g.id}
            onActivate={handleGlyphActivate}
            onRemove={handleGlyphRemove}
            onZoom={handleGlyphZoom}
          />
        ))}
      </div>
    )
  }, [displayGlyphs, activeId, handleGlyphActivate, handleGlyphRemove, handleGlyphZoom])

  // ── Guards ────────────────────────────────────────────────────────────────────
  if (!parsedFile) {
    return (
      <div className="fade-up">
        <InfoBox color="amber">กรุณาอัปโหลดไฟล์ PDF ใน Step 2 ก่อน</InfoBox>
      </div>
    )
  }

  if (chars.length === 0) {
    return (
      <div className="fade-up">
        <InfoBox color="amber">
          ไม่พบตัวอักษรจากไฟล์นี้ กลับ Step 2 เพื่อระบุตัวอักษรด้วยตนเอง
        </InfoBox>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────────────
  return (
    <div className="fade-up">
      {/* Summary stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {[
          { label:"OK",      val:summary.ok,       color:C.sage },
          { label:"Missing", val:summary.missing,  color:C.blush },
          { label:"Overflow",val:summary.overflow,  color:C.amber },
          { label:"ทั้งหมด", val:summary.total,    color:C.ink },
        ].map(s => (
          <div key={s.label} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 8px", textAlign:"center" }}>
            <p style={{ fontSize:22, fontWeight:300, color:s.color, fontFamily:"'DM Serif Display',serif" }}>{s.val}</p>
            <p style={{ fontSize:10, color:C.inkLt, marginTop:4, letterSpacing:"0.05em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Source info */}
      {parsedFile.charSource === "qr" && (
        <InfoBox color="sage">
          อ่านลำดับตัวอักษรจาก QR บนเทมเพลตแล้ว ({chars.length} ตัว)
        </InfoBox>
      )}
      {parsedFile.charSource === "manual" && (
        <InfoBox color="sage">
          ใช้ตัวอักษรที่ระบุเอง ({chars.length} ตัว)
        </InfoBox>
      )}

      <InfoBox color="amber">
        ถ้ากริดกับตัวเขียนไม่ตรง ให้ปรับ Grid Alignment ด้านล่างก่อน จากนั้นคลิกภาพเพื่อดูแบบขยาย
      </InfoBox>
      {isPartialRead && (
        <InfoBox color="amber">
          ตอนนี้ระบบอ่านได้ {analysisResult.pageCharsCount}/{chars.length} ตัว
          จาก {analysisResult.pagesUsed}/{analysisResult.totalPages} หน้า
        </InfoBox>
      )}
      {error && <InfoBox color="amber">{error}</InfoBox>}
      {tracing && <InfoBox color="sage">⏳ กำลัง trace SVG จากลายมือ…</InfoBox>}
      {!tracing && displayGlyphs.length > 0 && displayGlyphs.some(g => g.svgPath) && (
        <InfoBox color="sage">
          ✅ Trace SVG สำเร็จ {displayGlyphs.filter(g => g.svgPath).length}/{displayGlyphs.length} ตัว
        </InfoBox>
      )}

      {/* Grid alignment controls */}
      <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
        <p style={{ fontSize:11, fontWeight:500, letterSpacing:"0.08em", textTransform:"uppercase", color:C.inkLt, marginBottom:10 }}>
          Grid Alignment
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Adjuster 
            label="เลื่อนซ้าย/ขวา (X)" 
            value={calibration.offsetX}    
            min={-160} max={160} step={1} 
            onChange={v => debouncedSetCalibration(p => ({ ...p, offsetX: v }))} 
          />
          <Adjuster 
            label="เลื่อนขึ้น/ลง (Y)"  
            value={calibration.offsetY}    
            min={-160} max={160} step={1} 
            onChange={v => debouncedSetCalibration(p => ({ ...p, offsetY: v }))} 
          />
          <Adjuster 
            label="ขนาดช่อง (Cell)"    
            value={calibration.cellAdjust} 
            min={-48}  max={48}  step={1} 
            onChange={v => debouncedSetCalibration(p => ({ ...p, cellAdjust: v }))} 
          />
          <Adjuster 
            label="ระยะห่างช่อง (Gap)" 
            value={calibration.gapAdjust}  
            min={-30}  max={30}  step={1} 
            onChange={v => debouncedSetCalibration(p => ({ ...p, gapAdjust: v }))} 
          />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", gap:8, marginTop:12 }}>
          <div style={{ display:"flex", alignItems:"center", minHeight:30 }}>
            {autoInfo && <span style={{ fontSize:11, color:C.inkLt }}>{autoInfo}</span>}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={runAutoAlign}                                     variant="primary" size="sm" disabled={autoAligning}>{autoAligning ? "กำลังจัดอัตโนมัติ..." : "จัดอัตโนมัติ"}</Btn>
            <Btn onClick={() => setRemovedIds(new Set())}                   variant="ghost"   size="sm" disabled={removedIds.size === 0}>คืนค่าตัวที่ลบ</Btn>
            <Btn onClick={() => setCalibration(ZERO_CALIBRATION)}        variant="ghost"   size="sm">รีเซ็ตกริด</Btn>
            <Btn onClick={() => setShowDebug(v => !v)}                      variant="ghost"   size="sm">{showDebug ? "ซ่อน Overlay" : "ดู Grid Overlay"}</Btn>
          </div>
        </div>
      </div>

      {showDebug && (
        <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginBottom:14 }}>
          <p style={{ fontSize:11, color:C.inkLt, marginBottom:10 }}>
            ภาพที่ crop จากแต่ละช่อง —{" "}
            <span style={{ color:"#00a046" }}>●</span> OK{" "}
            <span style={{ color:"#c83c3c" }}>●</span> Missing{" "}
            <span style={{ color:"#c88c00" }}>●</span> Overflow
          </p>
          <GridDebugOverlay glyphs={displayGlyphs} />
        </div>
      )}

      {/* Memoized glyph grid */}
      {GlyphGrid}

      {/* Active glyph detail */}
      {activeGlyph && (
        <div style={{ marginTop:16, padding:"14px 16px", background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, fontSize:12, color:C.inkMd }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:88, height:88, borderRadius:10, border:`1px solid ${C.border}`, background:C.bgMuted, padding:6, cursor:"zoom-in" }} onClick={() => setZoomGlyph(activeGlyph)}>
              <img src={activeGlyph.preview} alt={`Preview ${activeGlyph.ch}`} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
            </div>
            <div style={{ lineHeight:1.8 }}>
              <div>เป้าหมาย: <b style={{ color:C.ink }}>{activeGlyph.ch}</b> • ลำดับช่อง {activeGlyph.index}</div>
              <div>รหัสช่อง: <b style={{ color:C.ink }}>HG{String(activeGlyph.index).padStart(3,"0")}</b></div>
              <div>สถานะ: <b style={{ color:C.sage }}>OK</b></div>
              <div>Ink coverage: {(activeGlyph.inkRatio * 100).toFixed(2)}% • Border touch: {(activeGlyph.edgeRatio * 100).toFixed(2)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Zoom modal */}
      {zoomGlyph && (
        <div role="dialog" aria-modal="true" onClick={() => setZoomGlyph(null)}
          style={{ position:"fixed", inset:0, background:"rgba(21,19,14,.72)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"min(680px,94vw)", borderRadius:16, background:"#fff", border:`1px solid ${C.border}`, padding:18 }}>
            <div style={{ display:"flex", alignItems:"center", marginBottom:12 }}>
              <p style={{ fontSize:14, fontWeight:600, color:C.ink }}>ตัวอักษรเป้าหมาย: {zoomGlyph.ch} • ลำดับช่อง {zoomGlyph.index}</p>
              <button type="button" onClick={() => setZoomGlyph(null)}
                style={{ marginLeft:"auto", border:`1px solid ${C.border}`, borderRadius:8, background:C.bgCard, padding:"4px 10px", fontSize:12, cursor:"pointer", color:C.ink }}>ปิด</button>
            </div>
            <div style={{ borderRadius:12, border:`1px solid ${C.border}`, background:C.bgMuted, padding:12, display:"flex", justifyContent:"center" }}>
              <img src={zoomGlyph.preview} alt={`Zoom ${zoomGlyph.ch}`} style={{ width:"min(520px,82vw)", height:"auto", objectFit:"contain" }} />
            </div>
            <p style={{ marginTop:10, fontSize:12, color:C.inkMd }}>
              Ink coverage {(zoomGlyph.inkRatio * 100).toFixed(2)}% • Border touch {(zoomGlyph.edgeRatio * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
