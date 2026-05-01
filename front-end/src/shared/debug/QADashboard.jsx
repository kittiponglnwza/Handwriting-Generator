/**
 * QA Dashboard - Color-coded quality assessment for Step 3
 *
 * Props:
 *   glyphs            – active (non-deleted) glyphs
 *   deletedGlyphs     – glyphs that were deleted
 *   qaReport          – report object from buildQaReport()
 *   onGlyphSelect     – (glyph) => void
 *   onRetryExtraction – () => void
 *   onDeleteGlyph     – (id) => void
 *   onRestoreGlyph    – (id) => void
 *   onRestoreAll      – () => void
 */

import React, { useState, useMemo } from 'react'
import C from "../../styles/colors"

export default function QADashboard({
  glyphs,
  deletedGlyphs = [],
  qaReport,
  onGlyphSelect,
  onRetryExtraction,
  onDeleteGlyph,
  onRestoreGlyph,
  onRestoreAll,
}) {
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showDetails, setShowDetails] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)

  // Status configuration
  const statusConfig = {
    excellent: { color: C.sage,   bg: C.sageLt,   label: 'Excellent', icon: '✓' },
    good:      { color: C.sage,   bg: C.sageLt,   label: 'Good',      icon: '✓' },
    acceptable:{ color: C.amber,  bg: C.amberLt,  label: 'Acceptable',icon: '⚠' },
    poor:      { color: C.amber,  bg: C.amberLt,  label: 'Poor',      icon: '⚠' },
    critical:  { color: C.blush,  bg: C.blushLt,  label: 'Critical',  icon: '✗' },
    overflow:  { color: C.blush,  bg: C.blushLt,  label: 'Overflow',  icon: '⚠' },
    missing:   { color: C.inkMd,  bg: C.bgMuted,  label: 'Missing',   icon: '—' },
    error:     { color: C.blush,  bg: C.blushLt,  label: 'Error',     icon: '✗' },
  }

  const filteredGlyphs = useMemo(() => {
    if (selectedStatus === 'all') return glyphs
    return glyphs.filter(g => (g.confidence?.status ?? g.status) === selectedStatus)
  }, [glyphs, selectedStatus])

  const statusPercentages = useMemo(() => {
    if (!qaReport || qaReport.total === 0) return {}
    return Object.fromEntries(
      Object.keys(statusConfig).map(s => [s, ((qaReport[s] || 0) / qaReport.total) * 100])
    )
  }, [qaReport])

  if (!qaReport) {
    return (
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, textAlign: 'center', color: C.inkLt }}>
        <p>Loading data QA...</p>
      </div>
    )
  }

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.ink }}>
          Glyph Extraction QA Dashboard
        </h3>
        <button onClick={() => setShowDetails(v => !v)} style={btnStyle(C)}>
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {/* ── Summary stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        {Object.entries(statusConfig).map(([status, cfg]) => {
          const count = qaReport[status] || 0
          if (count === 0) return null
          const active = selectedStatus === status
          return (
            <div
              key={status}
              onClick={() => setSelectedStatus(active ? 'all' : status)}
              style={{
                background: active ? cfg.bg : C.bgMuted,
                border: `2px solid ${active ? cfg.color : C.border}`,
                borderRadius: 8, padding: 12, textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4, color: cfg.color }}>{cfg.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.ink }}>{count}</div>
              <div style={{ fontSize: 11, color: C.inkLt, marginBottom: 2 }}>{cfg.label}</div>
              <div style={{ fontSize: 10, color: cfg.color, fontWeight: 500 }}>
                {(statusPercentages[status] || 0).toFixed(1)}%
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Quality metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <MetricBox label="Avg confidence" value={`${(qaReport.averageConfidence * 100).toFixed(1)}%`} />
        <MetricBox label="Total" value={qaReport.total} />
        <MetricBox
          label="Good / Excellent"
          value={`${qaReport.total > 0 ? Math.round(((qaReport.excellent + qaReport.good) / qaReport.total) * 100) : 0}%`}
          color={C.sage}
        />
      </div>

      {/* ── Recommendations ── */}
      {qaReport.recommendations?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: C.ink }}>Recommendations</h4>
          <ul style={{ margin: 0, paddingLeft: 20, color: C.inkMd }}>
            {qaReport.recommendations.map((rec, i) => (
              <li key={i} style={{ marginBottom: 4, fontSize: 12 }}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: C.inkLt }}>Filter:</span>
        <FilterBtn label={`All (${qaReport.total})`} active={selectedStatus === 'all'} color={C.ink} onClick={() => setSelectedStatus('all')} />
        {Object.entries(statusConfig).map(([status, cfg]) => {
          const count = qaReport[status] || 0
          if (count === 0) return null
          return (
            <FilterBtn
              key={status}
              label={`${cfg.label} (${count})`}
              active={selectedStatus === status}
              color={cfg.color}
              onClick={() => setSelectedStatus(selectedStatus === status ? 'all' : status)}
            />
          )
        })}
        {/* Deleted filter button */}
        {deletedGlyphs.length > 0 && (
          <FilterBtn
            label={`Deleted (${deletedGlyphs.length})`}
            active={showDeleted}
            color={C.blush}
            onClick={() => setShowDeleted(v => !v)}
          />
        )}
      </div>

      {/* ── Deleted panel ── */}
      {showDeleted && deletedGlyphs.length > 0 && (
        <div style={{
          marginBottom: 20,
          border: `1.5px dashed ${C.blush}`,
          borderRadius: 10,
          padding: 14,
          background: 'rgba(200,60,60,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.blush }}>
              Deleted glyphs ({deletedGlyphs.length})
            </p>
            {onRestoreAll && (
              <button
                onClick={onRestoreAll}
                style={{ ...btnStyle(C), fontSize: 11, color: C.blush, borderColor: C.blush }}
              >
                Restore all
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 6 }}>
            {deletedGlyphs.map(g => (
              <DeletedCard key={g.id} glyph={g} onRestore={onRestoreGlyph} />
            ))}
          </div>
        </div>
      )}

      {/* ── Glyph detail grid ── */}
      {showDetails && (
        <div style={{
          maxHeight: 400, overflowY: 'auto',
          border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, background: C.bgMuted,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 8 }}>
            {filteredGlyphs.map(g => {
              const cfg = statusConfig[g.confidence?.status ?? g.status] || statusConfig.error
              const canvas = g._normalizedCanvas || g._thaiProcessedCanvas || g._smartCroppedCanvas || g.canvas
              return (
                <div
                  key={g.id}
                  style={{
                    aspectRatio: '1', position: 'relative',
                    border: `2px solid ${cfg.color}`, borderRadius: 6, background: cfg.bg,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: 4, transition: 'transform 0.15s ease',
                  }}
                  onClick={() => onGlyphSelect?.(g)}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {canvas && (
                    <img src={canvas.toDataURL()} alt={g.ch}
                      style={{ width: '100%', height: '60%', objectFit: 'contain', marginBottom: 2 }} />
                  )}
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.ink }}>{g.ch}</div>
                  <div style={{ fontSize: 8, color: cfg.color, position: 'absolute', top: 2, right: 2 }}>{cfg.icon}</div>
                  {g.confidence && (
                    <div style={{ fontSize: 7, color: C.inkLt, position: 'absolute', bottom: 2, left: 2 }}>
                      {(g.confidence.overall * 100).toFixed(0)}%
                    </div>
                  )}
                  {/* inline delete in detail grid */}
                  {onDeleteGlyph && (
                    <button
                      title="Delete"
                      onClick={e => { e.stopPropagation(); onDeleteGlyph(g.id) }}
                      style={{
                        position: 'absolute', top: 2, left: 2,
                        width: 14, height: 14, borderRadius: '50%', border: 'none',
                        background: 'rgba(200,60,60,0.8)', color: '#fff',
                        fontSize: 8, lineHeight: '14px', textAlign: 'center',
                        cursor: 'pointer', padding: 0,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Issues list ── */}
      {showDetails && qaReport.issues?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: C.ink }}>
            Issues to fix ({qaReport.issues.length})
          </h4>
          <div style={{ maxHeight: 200, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 8, background: C.bgMuted }}>
            {qaReport.issues.map((issue, index) => (
              <div
                key={issue.id}
                onClick={() => onGlyphSelect?.(glyphs.find(g => g.id === issue.id))}
                style={{
                  padding: '8px 12px',
                  borderBottom: index < qaReport.issues.length - 1 ? `1px solid ${C.border}` : 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bgCard}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontSize: 16, fontWeight: 'bold', color: C.ink, minWidth: 20 }}>{issue.char}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.ink, fontWeight: 500 }}>{issue.issue}</div>
                  <div style={{ color: C.inkLt, fontSize: 11 }}>Confidence: {(issue.confidence * 100).toFixed(1)}%</div>
                  {issue.feedback?.[0] && (
                    <div style={{ color: C.amber, fontSize: 10, marginTop: 2 }}>{issue.feedback[0]}</div>
                  )}
                </div>
                {/* Delete from issues list */}
                {onDeleteGlyph && (
                  <button
                    title="Delete"
                    onClick={e => { e.stopPropagation(); onDeleteGlyph(issue.id) }}
                    style={{ ...btnStyle(C), padding: '2px 8px', fontSize: 10, color: C.blush, borderColor: C.blush }}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Deleted glyph card ────────────────────────────────────────────────────────
function DeletedCard({ glyph, onRestore }) {
  const hasPreview = !!glyph.preview
  const hasSvg = !!glyph.svgPath
  return (
    <div style={{
      borderRadius: 8, padding: '6px 4px 5px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      background: 'rgba(200,60,60,0.06)', border: '1.5px dashed rgba(200,60,60,0.4)',
      opacity: 0.8,
    }}>
      <div style={{
        width: '100%', aspectRatio: '1', background: '#fff', borderRadius: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {hasPreview ? (
          <img src={glyph.preview} alt={glyph.ch} style={{ width: '88%', height: '88%', objectFit: 'contain', filter: 'grayscale(0.6)' }} />
        ) : hasSvg ? (
          <svg viewBox={glyph.viewBox || '0 0 100 100'} style={{ width: '88%', height: '88%', opacity: 0.5 }}>
            <path d={glyph.svgPath} fill="none" stroke="#888" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span style={{ fontSize: 9, color: '#ccc' }}>—</span>
        )}
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#999', lineHeight: 1 }}>{glyph.ch}</p>
      {onRestore && (
        <button
          onClick={() => onRestore(glyph.id)}
          style={{
            marginTop: 2, padding: '2px 6px', fontSize: 9,
            border: '1px solid rgba(0,140,60,0.5)', borderRadius: 4,
            background: 'rgba(0,200,80,0.08)', color: '#00a046',
            cursor: 'pointer',
          }}
        >
          Restore
        </button>
      )}
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function MetricBox({ label, value, color }) {
  return (
    <div style={{ background: C.bgMuted, borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, color: C.inkLt, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color: color || C.ink }}>{value}</div>
    </div>
  )
}

function FilterBtn({ label, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
        border: `1px solid ${active ? color : C.border}`,
        background: active ? color : C.bgMuted,
        color: active ? '#fff' : color,
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  )
}

function btnStyle(C) {
  return {
    padding: '6px 12px', border: `1px solid ${C.border}`,
    borderRadius: 6, background: C.bgMuted, color: C.ink,
    fontSize: 12, cursor: 'pointer',
  }
}