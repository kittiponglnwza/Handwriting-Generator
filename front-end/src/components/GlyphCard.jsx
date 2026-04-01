/**
 * MEMOIZED GLYPH CARD COMPONENT
 * 
 * Fixes React performance issues:
 * - Wrapped in React.memo() to prevent unnecessary re-renders
 * - Optimized click handlers with useCallback
 * - Minimal prop dependencies
 */

import React, { memo, useCallback } from 'react'
import C from '../styles/colors'

const GlyphCard = memo(({ 
  glyph, 
  isActive, 
  onActivate, 
  onRemove, 
  onZoom 
}) => {
  // Memoize click handlers to prevent child re-renders
  const handleCardClick = useCallback(() => {
    onActivate(glyph.id)
  }, [glyph.id, onActivate])

  const handleRemoveClick = useCallback((e) => {
    e.stopPropagation()
    onRemove(glyph)
  }, [glyph, onRemove])

  const handleZoomClick = useCallback((e) => {
    e.stopPropagation()
    onZoom(glyph)
  }, [glyph, onZoom])

  // Determine status styling
  const getStatusStyle = useCallback((status) => {
    const styles = {
      ok: { border: C.sageMd, bg: C.bgCard, textColor: C.sage, label: "OK" },
      missing: { border: C.blushMd, bg: C.blushLt, textColor: C.blush, label: "Missing" },
      overflow: { border: C.amberMd, bg: C.amberLt, textColor: C.amber, label: "Overflow" },
    }
    return styles[status] || styles.ok
  }, [])

  const statusStyle = getStatusStyle(glyph.status)

  return (
    <div 
      key={glyph.id}
      className="glyph-card" 
      onClick={handleCardClick}
      style={{ 
        position: "relative", 
        background: statusStyle.bg, 
        border: `1.5px solid ${isActive ? C.ink : statusStyle.border}`, 
        borderRadius: 12, 
        padding: "8px 6px", 
        textAlign: "center", 
        cursor: "pointer" 
      }}
    >
      {/* Remove button */}
      <button 
        type="button" 
        onClick={handleRemoveClick}
        style={{ 
          position: "absolute", 
          top: 4, 
          right: 4, 
          width: 20, 
          height: 20, 
          borderRadius: 999, 
          border: `1px solid ${C.border}`, 
          background: "#fff", 
          color: C.inkMd, 
          fontSize: 10, 
          cursor: "pointer" 
        }}
        title="ลบช่องนี้"
      >
        ลบ
      </button>

      {/* Zoom button (image) */}
      <button 
        type="button" 
        onClick={handleZoomClick}
        style={{ 
          width: "100%", 
          aspectRatio: "1", 
          borderRadius: 8, 
          background: C.bgCard, 
          border: `1px solid ${C.border}`, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          overflow: "hidden", 
          marginBottom: 6, 
          padding: 4, 
          cursor: "zoom-in" 
        }}
        title="ดูภาพขยาย"
      >
        <img 
          src={glyph.preview} 
          alt={`Glyph ${glyph.ch}`} 
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "contain", 
            imageRendering: "auto" 
          }} 
        />
      </button>

      {/* Character */}
      <p style={{ 
        fontSize: 12, 
        fontWeight: 500, 
        color: C.ink 
      }}>
        {glyph.ch}
      </p>

      {/* Index */}
      <p style={{ 
        fontSize: 9, 
        color: C.inkLt, 
        marginTop: 1 
      }}>
        HG{String(glyph.index).padStart(3, "0")}
      </p>

      {/* Status */}
      <p style={{ 
        fontSize: 10, 
        color: statusStyle.textColor, 
        marginTop: 2 
      }}>
        {statusStyle.label}
      </p>
    </div>
  )
})

GlyphCard.displayName = 'GlyphCard'

export default GlyphCard
