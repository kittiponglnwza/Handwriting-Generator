// FontEngineDebugDemo.jsx - Debug demo showing layout fixes
// Demonstrates before/after comparison with visual debugging tools

import React, { useState, useMemo } from 'react'
import FontEngine, { useFontEngine } from '../FontEngine.jsx'
import { createDebugRenderer } from '../DebugRenderer.js'

// Debug demo component
export default function FontEngineDebugDemo() {
  const [text, setText] = useState('สวัสดีการเรียนรู้ Hello World')
  const [fontSize, setFontSize] = useState(48)
  const [showDebug, setShowDebug] = useState(true)
  const [seed, setSeed] = useState(12345)

  // Test cases for different layout issues
  const testCases = [
    {
      name: 'Basic Thai',
      text: 'สวัสดี',
      description: 'Simple Thai text - should have consistent spacing',
    },
    {
      name: 'Thai with Marks',
      text: 'การเรียน',
      description: 'Thai with tone marks - marks should attach to base characters',
    },
    {
      name: 'Complex Thai',
      text: 'เก้าสิบ',
      description: 'Complex clusters - multiple marks should position correctly',
    },
    {
      name: 'Mixed Script',
      text: 'สวัสดี Hello',
      description: 'Mixed Thai and English - proper spacing between scripts',
    },
    {
      name: 'Word Spacing',
      text: 'Hello World Test',
      description: 'English word spacing - spaces should be wider than character spacing',
    },
    {
      name: 'Multi-line',
      text: 'บรรทัดที่ 1\nบรรทัดที่ 2',
      description: 'Multi-line text - consistent baseline across lines',
    },
  ]

  const { renderText, layoutEngine, variationEngine } = useFontEngine({
    variation: {
      enabled: true,
      preset: 'natural',
      seed: seed,
    },
    kerning: true,
    letterSpacing: 0,
  })

  // Generate debug overlay
  const debugOverlay = useMemo(() => {
    if (!showDebug) return ''
    
    const positionedGlyphs = layoutEngine.layoutText(text, fontSize)
    const variedGlyphs = variationEngine.applyVariationToGlyphs(positionedGlyphs)
    const debugRenderer = createDebugRenderer({
      showBaseline: true,
      showBoundingBoxes: true,
      showAnchorPoints: true,
      showAdvanceWidth: true,
    })
    
    return debugRenderer.generateDebugOverlay(variedGlyphs, fontSize)
  }, [text, fontSize, showDebug, layoutEngine, variationEngine, seed])

  // Generate debug report
  const debugReport = useMemo(() => {
    const positionedGlyphs = layoutEngine.layoutText(text, fontSize)
    const variedGlyphs = variationEngine.applyVariationToGlyphs(positionedGlyphs)
    const debugRenderer = createDebugRenderer()
    
    return debugRenderer.generateDebugReport(variedGlyphs, fontSize)
  }, [text, fontSize, layoutEngine, variationEngine])

  // Render main text
  const svgString = renderText(text, fontSize)

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <h1>Font Engine Debug Demo</h1>
      <p>Visual debugging of layout issues and fixes</p>

      {/* Controls */}
      <section style={{ marginBottom: '30px' }}>
        <h2>Controls</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          marginBottom: '20px',
        }}>
          <div>
            <label>Text:</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                width: '100%',
                height: '60px',
                padding: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'monospace',
              }}
            />
          </div>
          
          <div>
            <label>Font Size: {fontSize}px</label>
            <input
              type="range"
              min="12"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Seed: {seed}</label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              style={{ width: '100%', padding: '5px' }}
            />
          </div>
          
          <div>
            <label>
              <input
                type="checkbox"
                checked={showDebug}
                onChange={(e) => setShowDebug(e.target.checked)}
              />
              Show Debug Overlay
            </label>
          </div>
        </div>
      </section>

      {/* Test Cases */}
      <section style={{ marginBottom: '30px' }}>
        <h2>Test Cases</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '15px',
        }}>
          {testCases.map((testCase, index) => (
            <div
              key={index}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <h3 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                {testCase.name}
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>
                {testCase.description}
              </p>
              <button
                onClick={() => setText(testCase.text)}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Test This Case
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Main Rendering */}
      <section style={{ marginBottom: '30px' }}>
        <h2>Rendering Output</h2>
        <div style={{
          padding: '20px',
          border: '2px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#fff',
          position: 'relative',
        }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Main SVG */}
            <div dangerouslySetInnerHTML={{ __html: svgString }} />
            
            {/* Debug Overlay */}
            {showDebug && (
              <div 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  pointerEvents: 'none' 
                }}
                dangerouslySetInnerHTML={{ __html: debugOverlay }}
              />
            )}
          </div>
        </div>
      </section>

      {/* Debug Report */}
      {showDebug && (
        <section style={{ marginBottom: '30px' }}>
          <h2>Debug Report</h2>
          <div style={{
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa',
          }}>
            <h3>Layout Analysis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <strong>Total Glyphs:</strong> {debugReport.glyphCount}
              </div>
              <div>
                <strong>Baseline Position:</strong> {debugReport.baselinePosition.toFixed(1)}px
              </div>
              <div>
                <strong>Average Spacing:</strong> {debugReport.spacingAnalysis.averageSpacing.toFixed(1)}px
              </div>
              <div>
                <strong>Inconsistent Spacing:</strong> {debugReport.spacingAnalysis.inconsistentSpacing ? 'Yes' : 'No'}
              </div>
            </div>

            <h3>Issues Found</h3>
            {debugReport.issues.length === 0 ? (
              <p style={{ color: 'green' }}>✅ No layout issues detected</p>
            ) : (
              <div>
                {debugReport.issues.map((issue, index) => (
                  <div key={index} style={{
                    padding: '10px',
                    margin: '5px 0',
                    border: `1px solid ${issue.severity === 'high' ? '#dc3545' : '#ffc107'}`,
                    borderRadius: '4px',
                    backgroundColor: issue.severity === 'high' ? '#f8d7da' : '#fff3cd',
                  }}>
                    <strong>{issue.type.replace('_', ' ').toUpperCase()}</strong>
                    <p style={{ margin: '5px 0' }}>{issue.description}</p>
                    {issue.details && (
                      <details style={{ fontSize: '12px' }}>
                        <summary>Details</summary>
                        <pre style={{ margin: '5px 0', fontSize: '11px' }}>
                          {JSON.stringify(issue.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Debug Legend */}
      {showDebug && (
        <section>
          <h2>Debug Legend</h2>
          <div style={{
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div>
                <span style={{ color: '#ff0000' }}>━━━</span> Baseline (should align all characters)
              </div>
              <div>
                <span style={{ color: '#0066cc' }}>┌─┐</span> Bounding boxes (show glyph dimensions)
              </div>
              <div>
                <span style={{ color: '#00cc00' }}>━━━</span> Advance width (character spacing)
              </div>
              <div>
                <span style={{ color: '#ff6600' }}>●</span> Anchor points (Thai mark attachment)
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

// Individual test components for specific issues
export function SpacingTest() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Character Spacing Test</h2>
      <p>Each box should have consistent spacing:</p>
      <FontEngine
        text="ABCDEFG"
        fontSize={48}
        config={{
          variation: { enabled: false }, // Disable variation to see spacing clearly
          kerning: false, // Disable kerning to see base spacing
        }}
      />
    </div>
  )
}

export function ThaiMarkTest() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Thai Mark Attachment Test</h2>
      <p>Tone marks should attach to base characters (orange dots):</p>
      <FontEngine
        text="กิ กี ก่ ก้"
        fontSize={48}
        config={{
          variation: { enabled: false },
        }}
      />
    </div>
  )
}

export function BaselineTest() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Baseline Alignment Test</h2>
      <p>All characters should align to red baseline:</p>
      <FontEngine
        text="AกาBขCค"
        fontSize={48}
        config={{
          variation: { enabled: false },
        }}
      />
    </div>
  )
}

export function WordSpacingTest() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Word Spacing Test</h2>
      <p>Space between words should be wider than character spacing:</p>
      <FontEngine
        text="Hello World Test"
        fontSize={48}
        config={{
          variation: { enabled: false },
        }}
      />
    </div>
  )
}
