/**
 * GlyphGrid.jsx
 *
 * Virtualised glyph grid for the Verify Glyphs step.
 *
 * Performance strategy:
 *   - Uses a simple row-virtualisation: only rows within the viewport
 *     (+ a small overscan) are rendered. Off-screen rows are replaced by
 *     spacer divs of the correct height.
 *   - Each cell calls getProcessed() which hits the LRU cache — the SVG
 *     parse & warning analysis runs at most once per (glyph + edit) pair.
 *   - The grid responds to zoom by recomputing column count and cell height.
 *   - Scroll position is restored via the parent-provided scrollTop ref.
 *
 * Props:
 *   glyphs         ProcessedGlyph[]  — already filtered/searched list
 *   selectedId     string | null
 *   zoom           number  (0.5–3)
 *   compareMode    boolean
 *   onSelect       (id: string) => void
 *   scrollContainerRef  React.Ref   — for scroll-position persistence
 */

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_CELL_SIZE = 110   // px at zoom=1
const CELL_GAP       = 10    // px
const OVERSCAN_ROWS  = 2     // rows above/below viewport to pre-render

// ── Glyph preview SVG ─────────────────────────────────────────────────────────

const GlyphPreview = memo(function GlyphPreview({ path, viewBox, color }) {
  if (!path) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#d1d5db', fontSize: 11,
      }}>
        —
      </div>
    )
  }
  return (
    <svg
      viewBox={viewBox || '0 0 100 100'}
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    >
      <path d={path} fill={color || '#1c1917'} />
    </svg>
  )
})

// ── Single glyph card ─────────────────────────────────────────────────────────

const GlyphCard = memo(function GlyphCard({
  processed,
  isSelected,
  compareMode,
  cellSize,
  onSelect,
}) {
  const { id, ch, unicode, path, viewBox, statusMeta, hasErrors, hasWarnings, hasEdits } = processed

  const handleClick = useCallback(() => onSelect(id), [id, onSelect])
  const handleKey   = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id) }
  }, [id, onSelect])

  const borderColor = isSelected
    ? '#1c1917'
    : hasErrors   ? '#ef4444'
    : hasWarnings ? '#f59e0b'
    : '#e5e7eb'

  const bgColor = isSelected
    ? '#fafaf9'
    : statusMeta.bg

  const previewSize = cellSize - 36  // subtract padding + label row

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Glyph ${ch || '?'} (${unicode}), status: ${statusMeta.label}`}
      onClick={handleClick}
      onKeyDown={handleKey}
      style={{
        position:      'relative',
        background:    bgColor,
        border:        `2px solid ${borderColor}`,
        borderRadius:  10,
        padding:       '8px 8px 6px',
        cursor:        'pointer',
        display:       'flex',
        flexDirection: 'column',
        gap:           4,
        userSelect:    'none',
        transition:    'border-color 0.12s ease, box-shadow 0.12s ease, transform 0.12s ease',
        boxShadow:     isSelected ? '0 0 0 3px rgba(28,25,23,0.12)' : 'none',
        transform:     isSelected ? 'translateY(-1px)' : 'none',
        outline:       'none',
        height:        cellSize,
      }}
      onMouseEnter={e => {
        if (!isSelected) e.currentTarget.style.borderColor = '#9ca3af'
      }}
      onMouseLeave={e => {
        if (!isSelected) e.currentTarget.style.borderColor = borderColor
      }}
    >
      {/* Status dot */}
      <div style={{
        position:     'absolute',
        top:           6,
        right:         6,
        width:         7,
        height:        7,
        borderRadius: '50%',
        background:    statusMeta.color,
        flexShrink:    0,
      }} />

      {/* Edit indicator */}
      {hasEdits && (
        <div style={{
          position:   'absolute',
          top:         6,
          left:        6,
          fontSize:    9,
          color:       '#3b82f6',
          fontWeight:  700,
          lineHeight:  1,
        }}>●</div>
      )}

      {/* Preview */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <GlyphPreview
          path={path}
          viewBox={viewBox}
          color={isSelected ? '#1c1917' : '#374151'}
        />
      </div>

      {/* Label row */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:             4,
        flexShrink:      0,
      }}>
        <span style={{
          fontSize:   Math.max(10, Math.min(16, cellSize * 0.13)),
          fontWeight: 600,
          color:      '#1c1917',
          lineHeight: 1,
          fontFamily: "'DM Serif Display', serif",
          overflow:   'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {ch || '?'}
        </span>
        <span style={{
          fontSize:   8,
          color:      '#9ca3af',
          lineHeight: 1,
          fontFamily: 'monospace',
          flexShrink: 0,
        }}>
          {unicode}
        </span>
      </div>
    </div>
  )
})

// ── Virtualised grid ──────────────────────────────────────────────────────────

export function GlyphGrid({
  glyphs,
  selectedId,
  zoom,
  compareMode,
  onSelect,
  scrollContainerRef,
  onScroll,
}) {
  const containerRef  = useRef(null)
  const [viewportH, setViewportH] = useState(600)

  // Merge the external ref with our local ref
  useEffect(() => {
    if (!scrollContainerRef) return
    scrollContainerRef.current = containerRef.current
  }, [scrollContainerRef])

  // Observe container height changes
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setViewportH(entry.contentRect.height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const cellSize = Math.round(BASE_CELL_SIZE * zoom)
  const [gridW, setGridW] = useState(800)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setGridW(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Compute grid layout
  const { cols, rowH, rows, totalH } = useMemo(() => {
    const availW  = gridW - 40  // account for padding
    const cols    = Math.max(1, Math.floor((availW + CELL_GAP) / (cellSize + CELL_GAP)))
    const rowH    = cellSize + CELL_GAP
    const rows    = Math.ceil(glyphs.length / cols)
    const totalH  = rows * rowH + 20 // bottom padding
    return { cols, rowH, rows, totalH }
  }, [gridW, cellSize, glyphs.length])

  const [scrollTop, setScrollTopLocal] = useState(0)

  const handleScroll = useCallback((e) => {
    const st = e.currentTarget.scrollTop
    setScrollTopLocal(st)
    onScroll?.(st)
  }, [onScroll])

  // Visible row range (virtualisation)
  const { firstRow, lastRow } = useMemo(() => {
    const firstRow = Math.max(0, Math.floor(scrollTop / rowH) - OVERSCAN_ROWS)
    const lastRow  = Math.min(rows - 1, Math.ceil((scrollTop + viewportH) / rowH) + OVERSCAN_ROWS)
    return { firstRow, lastRow }
  }, [scrollTop, viewportH, rowH, rows])

  // Keyboard navigation within grid
  const handleGridKey = useCallback((e) => {
    if (!selectedId || !glyphs.length) return
    const idx = glyphs.findIndex(g => g.id === selectedId)
    if (idx === -1) return
    let next = idx
    if (e.key === 'ArrowRight') next = Math.min(glyphs.length - 1, idx + 1)
    else if (e.key === 'ArrowLeft') next = Math.max(0, idx - 1)
    else if (e.key === 'ArrowDown') next = Math.min(glyphs.length - 1, idx + cols)
    else if (e.key === 'ArrowUp')   next = Math.max(0, idx - cols)
    else return
    e.preventDefault()
    onSelect(glyphs[next].id)
  }, [selectedId, glyphs, cols, onSelect])

  if (glyphs.length === 0) {
    return (
      <div style={{
        flex:           1,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          '#9ca3af',
        fontSize:       14,
        padding:        40,
      }}>
        No glyphs match the current filter.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      onKeyDown={handleGridKey}
      tabIndex={-1}
      aria-label="Glyph grid"
      style={{
        flex:      1,
        overflowY: 'auto',
        overflowX: 'hidden',
        outline:   'none',
        position:  'relative',
      }}
    >
      {/* Total height sentinel for scrollbar */}
      <div style={{ height: totalH, position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top:      firstRow * rowH + 20,
          left:     20,
          right:    20,
          display:  'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gap:      CELL_GAP,
        }}>
          {glyphs.slice(firstRow * cols, (lastRow + 1) * cols).map((g) => (
            <GlyphCard
              key={g.id}
              processed={g}
              isSelected={g.id === selectedId}
              compareMode={compareMode}
              cellSize={cellSize}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}