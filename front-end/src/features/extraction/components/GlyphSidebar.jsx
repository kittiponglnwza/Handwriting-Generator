/**
 * GlyphSidebar.jsx
 *
 * Detail panel shown on the right when a glyph is selected.
 * Displays: large preview, character info, status, metrics, debug warnings,
 * compare mode (default vs edited path), note editor, and action buttons.
 */

import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { getStatusMeta } from '../utils/glyphCache.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function MetricRow({ label, value, mono = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
      <span style={{ fontSize: 11, color: '#6b7280' }}>{label}</span>
      <span style={{
        fontSize:   11,
        fontWeight: 500,
        color:      '#1c1917',
        fontFamily: mono ? 'monospace' : 'inherit',
      }}>{value ?? '—'}</span>
    </div>
  )
}

function WarningBadge({ warning }) {
  const isError = warning.severity === 'error'
  return (
    <div style={{
      display:      'flex',
      gap:           6,
      alignItems:   'flex-start',
      padding:      '6px 8px',
      borderRadius:  6,
      background:    isError ? '#fef2f2' : '#fffbeb',
      border:       `1px solid ${isError ? '#fecaca' : '#fde68a'}`,
      marginBottom:  4,
    }}>
      <span style={{ fontSize: 12, flexShrink: 0 }}>{isError ? '🔴' : '⚠️'}</span>
      <div>
        <span style={{
          display:    'block',
          fontSize:   10,
          fontWeight: 600,
          color:      isError ? '#991b1b' : '#92400e',
          fontFamily: 'monospace',
          marginBottom: 1,
        }}>{warning.code}</span>
        <span style={{ fontSize: 11, color: isError ? '#7f1d1d' : '#78350f', lineHeight: 1.4 }}>
          {warning.message}
        </span>
      </div>
    </div>
  )
}

// ── SVG Preview ───────────────────────────────────────────────────────────────

function GlyphPreviewLarge({ path, originalPath, viewBox, compareMode }) {
  const vb = viewBox || '0 0 100 100'
  return (
    <div style={{
      background:   '#f9fafb',
      borderRadius:  10,
      border:        '1px solid #e5e7eb',
      overflow:      'hidden',
      position:      'relative',
    }}>
      {compareMode && originalPath && originalPath !== path ? (
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, borderRight: '1px solid #e5e7eb', padding: 8 }}>
            <p style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center', marginBottom: 4 }}>ORIGINAL</p>
            <svg viewBox={vb} style={{ width: '100%', aspectRatio: '1', display: 'block' }}>
              <path d={originalPath} fill="#6b7280" />
            </svg>
          </div>
          <div style={{ flex: 1, padding: 8 }}>
            <p style={{ fontSize: 9, color: '#3b82f6', textAlign: 'center', marginBottom: 4 }}>EDITED</p>
            <svg viewBox={vb} style={{ width: '100%', aspectRatio: '1', display: 'block' }}>
              <path d={path} fill="#1c1917" />
            </svg>
          </div>
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          {path ? (
            <svg viewBox={vb} style={{ width: '100%', aspectRatio: '1', display: 'block' }}>
              {/* Grid lines for reference */}
              <line x1="0" y1="80" x2="100" y2="80" stroke="#e5e7eb" strokeWidth="0.4" strokeDasharray="2,2" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.3" strokeDasharray="1,3" />
              <path d={path} fill="#1c1917" />
            </svg>
          ) : (
            <div style={{
              aspectRatio:    '1',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              color:          '#d1d5db',
              fontSize:       12,
            }}>No path data</div>
          )}
        </div>
      )}

      {/* Baseline indicator */}
      {!compareMode && path && (
        <div style={{
          position:   'absolute',
          bottom:      '22%',
          left:         8,
          right:        8,
          height:       1,
          background:  'rgba(239,68,68,0.3)',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}

// ── Debug Panel ───────────────────────────────────────────────────────────────

function DebugPanel({ processed }) {
  const [open, setOpen] = useState(false)
  const { path, bboxW, bboxH, warnings, ch, unicode, cp } = processed

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width:         '100%',
          padding:       '6px 10px',
          border:        '1px dashed #d1d5db',
          borderRadius:   6,
          background:    'transparent',
          cursor:        'pointer',
          fontSize:       11,
          color:         '#6b7280',
          textAlign:     'left',
          fontFamily:    'inherit',
          display:       'flex',
          alignItems:    'center',
          gap:            6,
        }}
      >
        <span>🔬</span>
        <span>Debug Panel</span>
        {(processed.hasErrors || processed.hasWarnings) && (
          <span style={{
            marginLeft: 'auto',
            fontSize:    9,
            fontWeight:  700,
            color:       processed.hasErrors ? '#ef4444' : '#f59e0b',
            background:  processed.hasErrors ? '#fef2f2' : '#fffbeb',
            padding:    '1px 5px',
            borderRadius: 10,
          }}>
            {warnings.length} issue{warnings.length !== 1 ? 's' : ''}
          </span>
        )}
      </button>
    )
  }

  // Compute path stats
  const tokens = path ? path.trim().split(/(?=[MLCQZz])/).filter(Boolean) : []
  const cmdCounts = tokens.reduce((acc, tok) => {
    const cmd = tok.trim()[0]?.toUpperCase()
    if (cmd) acc[cmd] = (acc[cmd] || 0) + 1
    return acc
  }, {})
  const subpathCount = (path?.match(/M/gi) || []).length
  const isClosed     = /[Zz]/.test(path || '')

  return (
    <div style={{
      border:        '1px solid #e5e7eb',
      borderRadius:   8,
      overflow:      'hidden',
      fontSize:       11,
    }}>
      {/* Header */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '8px 10px',
        background:     '#f3f4f6',
        borderBottom:   '1px solid #e5e7eb',
      }}>
        <span style={{ fontWeight: 600, color: '#374151' }}>🔬 Debug Panel</span>
        <button
          onClick={() => setOpen(false)}
          style={{
            border: 'none', background: 'none', cursor: 'pointer',
            color: '#9ca3af', fontSize: 14, padding: 0, lineHeight: 1,
          }}
        >×</button>
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Identity */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', marginBottom: 4, letterSpacing: '0.05em' }}>IDENTITY</p>
          <MetricRow label="Character" value={`'${ch}'`} mono />
          <MetricRow label="Unicode"   value={unicode}   mono />
          <MetricRow label="Codepoint" value={`0x${cp?.toString(16).toUpperCase().padStart(4, '0')}`} mono />
        </div>

        {/* Path stats */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', marginBottom: 4, letterSpacing: '0.05em' }}>PATH ANALYSIS</p>
          <MetricRow label="Commands"   value={Object.entries(cmdCounts).map(([k, v]) => `${k}×${v}`).join('  ')} mono />
          <MetricRow label="Subpaths"   value={subpathCount} />
          <MetricRow label="Closed"     value={isClosed ? '✓ Yes' : '✗ No'} />
          <MetricRow label="BBox W×H"   value={`${bboxW} × ${bboxH}`} mono />
          <MetricRow label="Aspect"     value={bboxH > 0 ? (bboxW / bboxH).toFixed(2) : '—'} mono />
          <MetricRow label="Path length" value={path ? `${path.length} chars` : '—'} />
        </div>

        {/* M/N sibling note */}
        {(ch === 'm' || ch === 'n') && (
          <div style={{
            padding:    '6px 8px',
            background: '#eff6ff',
            borderRadius: 6,
            border:     '1px solid #bfdbfe',
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#1d4ed8', marginBottom: 3 }}>
              m/n SIBLING CHECK
            </p>
            <p style={{ fontSize: 10, color: '#1e40af', lineHeight: 1.5 }}>
              '{ch}' detected. Expected bbox width: 30–70u.
              Current: {bboxW}u → {bboxW >= 30 && bboxW <= 70 ? '✓ OK' : '⚠ Out of range'}.
              Verify Unicode mapping matches codepoint above.
            </p>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', marginBottom: 4, letterSpacing: '0.05em' }}>
              ISSUES ({warnings.length})
            </p>
            {warnings.map((w, i) => <WarningBadge key={i} warning={w} />)}
          </div>
        )}

        {warnings.length === 0 && (
          <div style={{
            padding:    '6px 8px',
            background: '#f0fdf4',
            borderRadius: 6,
            border:     '1px solid #bbf7d0',
            fontSize:   11,
            color:      '#166534',
          }}>
            ✓ No issues detected
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main sidebar ──────────────────────────────────────────────────────────────

export const GlyphSidebar = memo(function GlyphSidebar({
  processed,
  compareMode,
  edit,
  onEditPath,
  onEditNote,
  onClearEdit,
  onToggleCompare,
}) {
  const noteRef = useRef(null)

  if (!processed) {
    return (
      <aside style={{
        width:          280,
        minWidth:       280,
        borderLeft:     '1px solid #e5e7eb',
        background:     '#fafafa',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          '#9ca3af',
        fontSize:       13,
        padding:        24,
        textAlign:      'center',
        lineHeight:     1.5,
      }}>
        Select a glyph to<br />inspect its details
      </aside>
    )
  }

  const {
    ch, unicode, status, statusMeta, path, originalPath,
    viewBox, confidence, bboxW, bboxH, warnings, hasEdits, note,
  } = processed

  const displayPath = edit?.path ?? path

  return (
    <aside style={{
      width:          280,
      minWidth:       280,
      borderLeft:     '1px solid #e5e7eb',
      background:     '#fafafa',
      display:        'flex',
      flexDirection:  'column',
      overflowY:      'auto',
      overflowX:      'hidden',
    }}>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Preview */}
        <GlyphPreviewLarge
          path={displayPath}
          originalPath={originalPath}
          viewBox={viewBox}
          compareMode={compareMode}
        />

        {/* Character header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width:          48,
            height:         48,
            borderRadius:    8,
            background:     '#f3f4f6',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:        28,
            fontFamily:     "'DM Serif Display', serif",
            color:          '#1c1917',
            flexShrink:      0,
          }}>
            {ch || '?'}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#1c1917', lineHeight: 1.2 }}>
              {ch || 'Unknown'}
            </p>
            <p style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace', marginTop: 2 }}>
              {unicode}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:           5,
            padding:      '3px 10px',
            borderRadius:  20,
            background:    statusMeta.bg,
            border:       `1px solid ${statusMeta.color}30`,
            fontSize:      11,
            fontWeight:    600,
            color:         statusMeta.color,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: statusMeta.color, flexShrink: 0,
            }} />
            {statusMeta.label}
          </span>

          {confidence !== null && confidence !== undefined && (
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              {Math.round(confidence * 100)}% confidence
            </span>
          )}

          {hasEdits && (
            <span style={{
              fontSize:   10,
              color:      '#3b82f6',
              fontWeight: 600,
              marginLeft: 'auto',
            }}>● Edited</span>
          )}
        </div>

        {/* Metrics */}
        <div style={{
          background:   '#fff',
          borderRadius:  8,
          border:        '1px solid #e5e7eb',
          padding:      '8px 12px',
        }}>
          <p style={{
            fontSize:      10,
            fontWeight:    600,
            color:         '#9ca3af',
            letterSpacing: '0.05em',
            marginBottom:   6,
          }}>METRICS</p>
          <MetricRow label="BBox width"  value={`${bboxW}u`}  mono />
          <MetricRow label="BBox height" value={`${bboxH}u`}  mono />
          <MetricRow label="Status"      value={status}       mono />
        </div>

        {/* Warnings summary (collapsed) */}
        {warnings.length > 0 && !processed.hasErrors && !processed.hasWarnings && null}

        {/* Compare mode toggle */}
        <button
          onClick={onToggleCompare}
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:             8,
            padding:        '7px 12px',
            borderRadius:    8,
            border:         `1px solid ${compareMode ? '#1c1917' : '#e5e7eb'}`,
            background:      compareMode ? '#1c1917' : '#fff',
            color:           compareMode ? '#fff' : '#374151',
            cursor:         'pointer',
            fontSize:        12,
            fontWeight:      compareMode ? 600 : 400,
            fontFamily:     'inherit',
            transition:     'all 0.15s ease',
          }}
        >
          <span>{compareMode ? '⊞' : '⊟'}</span>
          {compareMode ? 'Hide comparison' : 'Compare original'}
        </button>

        {/* Note editor */}
        <div>
          <label style={{
            fontSize:   10,
            fontWeight: 600,
            color:      '#9ca3af',
            letterSpacing: '0.05em',
            display:    'block',
            marginBottom: 4,
          }}>
            NOTE
          </label>
          <textarea
            ref={noteRef}
            value={edit?.note ?? note ?? ''}
            onChange={e => onEditNote(e.target.value)}
            placeholder="Add a note about this glyph…"
            rows={3}
            style={{
              width:       '100%',
              padding:    '7px 10px',
              borderRadius: 6,
              border:     '1px solid #e5e7eb',
              background:  '#fff',
              fontSize:    11,
              color:       '#374151',
              fontFamily: 'inherit',
              resize:     'vertical',
              outline:    'none',
              lineHeight:  1.5,
              boxSizing:  'border-box',
            }}
            onFocus={e => e.target.style.borderColor = '#1c1917'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Debug panel */}
        <DebugPanel processed={processed} />

        {/* Actions */}
        {hasEdits && (
          <button
            onClick={onClearEdit}
            style={{
              padding:      '7px 0',
              borderRadius:  8,
              border:        '1px solid #fecaca',
              background:    '#fef2f2',
              color:         '#dc2626',
              cursor:       'pointer',
              fontSize:      12,
              fontFamily:   'inherit',
              fontWeight:    500,
            }}
          >
            Reset to original
          </button>
        )}

      </div>
    </aside>
  )
})