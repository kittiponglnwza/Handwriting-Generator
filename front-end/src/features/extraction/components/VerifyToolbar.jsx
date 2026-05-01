/**
 * VerifyToolbar.jsx
 *
 * Toolbar for the Verify Glyphs step.
 * Contains: search, filter pills, zoom slider, compare toggle, stats summary.
 */

import React, { memo, useCallback, useRef } from 'react'

// ── Filter pills ──────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'ok',       label: 'Good' },
  { key: 'poor',     label: 'Poor' },
  { key: 'missing',  label: 'Missing' },
  { key: 'warnings', label: '⚠ Issues' },
]

function FilterPill({ active, label, count, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:           4,
        padding:      '4px 10px',
        borderRadius:  20,
        border:       `1px solid ${active ? '#1c1917' : '#e5e7eb'}`,
        background:    active ? '#1c1917' : '#fff',
        color:         active ? '#fff' : '#6b7280',
        cursor:       'pointer',
        fontSize:      11,
        fontWeight:    active ? 600 : 400,
        fontFamily:   'inherit',
        transition:   'all 0.12s ease',
        whiteSpace:   'nowrap',
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{
          fontSize:     9,
          fontWeight:   700,
          background:   active ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
          color:        active ? '#fff' : '#9ca3af',
          borderRadius: 10,
          padding:     '0 4px',
          lineHeight:   '14px',
        }}>
          {count}
        </span>
      )}
    </button>
  )
}

// ── Zoom control ──────────────────────────────────────────────────────────────

function ZoomControl({ zoom, onZoom }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={() => onZoom(Math.max(0.5, zoom - 0.25))}
        aria-label="Zoom out"
        style={{
          width: 26, height: 26, borderRadius: 6,
          border: '1px solid #e5e7eb', background: '#fff',
          cursor: 'pointer', fontSize: 14, color: '#374151',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit',
        }}
      >−</button>

      <input
        type="range"
        min={0.5} max={2.5} step={0.25}
        value={zoom}
        onChange={e => onZoom(parseFloat(e.target.value))}
        aria-label="Zoom level"
        style={{ width: 72, accentColor: '#1c1917', cursor: 'pointer' }}
      />

      <button
        onClick={() => onZoom(Math.min(2.5, zoom + 0.25))}
        aria-label="Zoom in"
        style={{
          width: 26, height: 26, borderRadius: 6,
          border: '1px solid #e5e7eb', background: '#fff',
          cursor: 'pointer', fontSize: 14, color: '#374151',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit',
        }}
      >+</button>

      <span style={{ fontSize: 10, color: '#9ca3af', minWidth: 32, textAlign: 'center', fontFamily: 'monospace' }}>
        {Math.round(zoom * 100)}%
      </span>
    </div>
  )
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

export const VerifyToolbar = memo(function VerifyToolbar({
  search,
  onSearch,
  filter,
  onFilter,
  zoom,
  onZoom,
  compareMode,
  onToggleCompare,
  stats,           // { total, ok, poor, missing, warnings }
}) {
  const searchRef = useRef(null)

  const handleClearSearch = useCallback(() => {
    onSearch('')
    searchRef.current?.focus()
  }, [onSearch])

  const filterCounts = {
    all:      stats.total,
    ok:       stats.ok,
    poor:     stats.poor,
    missing:  stats.missing,
    warnings: stats.warnings,
  }

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:           10,
      padding:      '10px 20px',
      borderBottom:  '1px solid #e5e7eb',
      background:    '#fff',
      flexShrink:    0,
      flexWrap:     'wrap',
      minHeight:     52,
    }}>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <svg
          width="13" height="13"
          viewBox="0 0 24 24"
          fill="none" stroke="#9ca3af" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search character…"
          aria-label="Search glyphs"
          style={{
            padding:      '6px 28px 6px 28px',
            borderRadius:  8,
            border:        '1px solid #e5e7eb',
            fontSize:      12,
            color:         '#374151',
            background:    '#f9fafb',
            outline:      'none',
            width:         180,
            fontFamily:   'inherit',
            transition:   'border-color 0.12s',
          }}
          onFocus={e => e.target.style.borderColor = '#1c1917'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
        {search && (
          <button
            onClick={handleClearSearch}
            aria-label="Clear search"
            style={{
              position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
              border: 'none', background: 'none', cursor: 'pointer',
              color: '#9ca3af', fontSize: 14, padding: 0, lineHeight: 1,
            }}
          >×</button>
        )}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: '#e5e7eb', flexShrink: 0 }} />

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <FilterPill
            key={f.key}
            active={filter === f.key}
            label={f.label}
            count={filterCounts[f.key]}
            onClick={() => onFilter(f.key)}
          />
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* Stats summary */}
      <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
        {stats.total} glyph{stats.total !== 1 ? 's' : ''}
      </span>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: '#e5e7eb', flexShrink: 0 }} />

      {/* Zoom */}
      <ZoomControl zoom={zoom} onZoom={onZoom} />

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: '#e5e7eb', flexShrink: 0 }} />

      {/* Compare toggle */}
      <button
        onClick={onToggleCompare}
        aria-pressed={compareMode}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:           5,
          padding:      '5px 10px',
          borderRadius:  8,
          border:       `1px solid ${compareMode ? '#1c1917' : '#e5e7eb'}`,
          background:    compareMode ? '#1c1917' : '#fff',
          color:         compareMode ? '#fff' : '#6b7280',
          cursor:       'pointer',
          fontSize:      11,
          fontFamily:   'inherit',
          fontWeight:    compareMode ? 600 : 400,
          transition:   'all 0.12s ease',
          whiteSpace:   'nowrap',
        }}
      >
        <span style={{ fontSize: 13 }}>⊞</span>
        Compare
      </button>

    </div>
  )
})