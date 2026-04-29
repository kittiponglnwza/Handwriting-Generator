/**
 * QA Dashboard - Color-coded quality assessment for Step 3
 * 
 * Provides visual feedback on extraction quality with actionable insights
 * and recommendations for improving problematic glyphs.
 */

import React, { useState, useMemo } from 'react'
import C from '../styles/colors'

export default function QADashboard({ glyphs, qaReport, onGlyphSelect, onRetryExtraction }) {
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showDetails, setShowDetails] = useState(false)

  // Filter glyphs by selected status
  const filteredGlyphs = useMemo(() => {
    if (selectedStatus === 'all') return glyphs
    return glyphs.filter(glyph => glyph.status === selectedStatus)
  }, [glyphs, selectedStatus])

  // Status configuration with colors and labels
  const statusConfig = {
    excellent: { color: C.sage, bg: C.sageLt, label: 'Excellent', icon: '✓' },
    good: { color: C.sage, bg: C.sageLt, label: 'Good', icon: '✓' },
    acceptable: { color: C.amber, bg: C.amberLt, label: 'Acceptable', icon: '⚠' },
    poor: { color: C.amber, bg: C.amberLt, label: 'Poor', icon: '⚠' },
    critical: { color: C.blush, bg: C.blushLt, label: 'Critical', icon: '✗' },
    overflow: { color: C.blush, bg: C.blushLt, label: 'Overflow', icon: '⚠' },
    missing: { color: C.inkMd, bg: C.bgMuted, label: 'Missing', icon: '—' },
    error: { color: C.blush, bg: C.blushLt, label: 'Error', icon: '✗' }
  }

  // Calculate status percentages
  const statusPercentages = useMemo(() => {
    if (!qaReport || qaReport.total === 0) return {}
    
    const percentages = {}
    Object.entries(statusConfig).forEach(([status, config]) => {
      const count = qaReport[status] || 0
      percentages[status] = (count / qaReport.total) * 100
    })
    
    return percentages
  }, [qaReport])

  if (!qaReport) {
    return (
      <div style={{ 
        background: C.bgCard, 
        border: `1px solid ${C.border}`, 
        borderRadius: 12, 
        padding: 16,
        textAlign: 'center',
        color: C.inkLt
      }}>
        <p>Loading data QA...</p>
      </div>
    )
  }

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.ink }}>
          Glyph Extraction QA Dashboard
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              padding: '6px 12px',
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              background: C.bgMuted,
              color: C.ink,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
          {onRetryExtraction && (
            <button
              onClick={onRetryExtraction}
              style={{
                padding: '6px 12px',
                border: `1px solid ${C.sage}`,
                borderRadius: 6,
                background: C.sage,
                color: '#fff',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Re-extract
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = qaReport[status] || 0
          const percentage = statusPercentages[status] || 0
          
          if (count === 0) return null
          
          return (
            <div
              key={status}
              onClick={() => setSelectedStatus(selectedStatus === status ? 'all' : status)}
              style={{
                background: selectedStatus === status ? config.bg : C.bgMuted,
                border: `2px solid ${selectedStatus === status ? config.color : C.border}`,
                borderRadius: 8,
                padding: 12,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4, color: config.color }}>
                {config.icon}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.ink }}>
                {count}
              </div>
              <div style={{ fontSize: 11, color: C.inkLt, marginBottom: 2 }}>
                {config.label}
              </div>
              <div style={{ fontSize: 10, color: config.color, fontWeight: 500 }}>
                {percentage.toFixed(1)}%
              </div>
            </div>
          )
        })}
      </div>

      {/* Quality Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ background: C.bgMuted, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: C.inkLt, marginBottom: 4 }}>Avg confidence</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.ink }}>
            {(qaReport.averageConfidence * 100).toFixed(1)}%
          </div>
        </div>
        
        <div style={{ background: C.bgMuted, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: C.inkLt, marginBottom: 4 }}>Total</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.ink }}>
            {qaReport.total}
          </div>
        </div>
        
        <div style={{ background: C.bgMuted, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: C.inkLt, marginBottom: 4 }}>Good / Excellent</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.sage }}>
            {qaReport.total > 0
              ? Math.round(((qaReport.excellent + qaReport.good) / qaReport.total) * 100)
              : 0}%
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {qaReport.recommendations && qaReport.recommendations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: C.ink }}>
            Recommendations
          </h4>
          <ul style={{ margin: 0, paddingLeft: 20, color: C.inkMd }}>
            {qaReport.recommendations.map((rec, index) => (
              <li key={index} style={{ marginBottom: 4, fontSize: 12 }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: C.inkLt }}>Filter:</span>
        <button
          onClick={() => setSelectedStatus('all')}
          style={{
            padding: '4px 8px',
            border: `1px solid ${selectedStatus === 'all' ? C.ink : C.border}`,
            borderRadius: 4,
            background: selectedStatus === 'all' ? C.ink : C.bgMuted,
            color: selectedStatus === 'all' ? '#fff' : C.ink,
            fontSize: 11,
            cursor: 'pointer'
          }}
        >
          All ({qaReport.total})
        </button>
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = qaReport[status] || 0
          if (count === 0) return null
          
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(selectedStatus === status ? 'all' : status)}
              style={{
                padding: '4px 8px',
                border: `1px solid ${selectedStatus === status ? config.color : C.border}`,
                borderRadius: 4,
                background: selectedStatus === status ? config.color : C.bgMuted,
                color: selectedStatus === status ? '#fff' : config.color,
                fontSize: 11,
                cursor: 'pointer'
              }}
            >
              {config.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Glyph Grid */}
      {showDetails && (
        <div style={{ 
          maxHeight: 400, 
          overflowY: 'auto',
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: 12,
          background: C.bgMuted
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', 
            gap: 8 
          }}>
            {filteredGlyphs.map(glyph => {
              const config = statusConfig[glyph.status] || statusConfig.error
              const canvas = glyph._normalizedCanvas || glyph._thaiProcessedCanvas || glyph._smartCroppedCanvas || glyph.canvas
              
              return (
                <div
                  key={glyph.id}
                  onClick={() => onGlyphSelect && onGlyphSelect(glyph)}
                  style={{
                    aspectRatio: '1',
                    border: `2px solid ${config.color}`,
                    borderRadius: 6,
                    background: config.bg,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 4,
                    position: 'relative',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  {canvas && (
                    <img 
                      src={canvas.toDataURL()} 
                      alt={glyph.ch}
                      style={{ 
                        width: '100%', 
                        height: '60%', 
                        objectFit: 'contain',
                        marginBottom: 2
                      }}
                    />
                  )}
                  <div style={{ 
                    fontSize: 10, 
                    fontWeight: 600, 
                    color: C.ink 
                  }}>
                    {glyph.ch}
                  </div>
                  <div style={{ 
                    fontSize: 8, 
                    color: config.color,
                    position: 'absolute',
                    top: 2,
                    right: 2
                  }}>
                    {config.icon}
                  </div>
                  {glyph.confidence && (
                    <div style={{ 
                      fontSize: 7, 
                      color: C.inkLt,
                      position: 'absolute',
                      bottom: 2,
                      left: 2
                    }}>
                      {(glyph.confidence.overall * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Issues List */}
      {qaReport.issues && qaReport.issues.length > 0 && showDetails && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: C.ink }}>
            Issues to fix ({qaReport.issues.length})
          </h4>
          <div style={{ 
            maxHeight: 200, 
            overflowY: 'auto',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            background: C.bgMuted
          }}>
            {qaReport.issues.map((issue, index) => (
              <div
                key={issue.id}
                onClick={() => onGlyphSelect && onGlyphSelect(glyphs.find(g => g.id === issue.id))}
                style={{
                  padding: '8px 12px',
                  borderBottom: index < qaReport.issues.length - 1 ? `1px solid ${C.border}` : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.bgCard
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{ 
                  fontSize: 16, 
                  fontWeight: 'bold', 
                  color: C.ink,
                  minWidth: 20
                }}>
                  {issue.char}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.ink, fontWeight: 500 }}>
                    {issue.issue}
                  </div>
                  <div style={{ color: C.inkLt, fontSize: 11 }}>
                    Confidence: {(issue.confidence * 100).toFixed(1)}%
                  </div>
                  {issue.feedback && issue.feedback.length > 0 && (
                    <div style={{ color: C.amber, fontSize: 10, marginTop: 2 }}>
                      {issue.feedback[0]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}