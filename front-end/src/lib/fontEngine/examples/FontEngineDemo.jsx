// FontEngineDemo.jsx - Comprehensive demonstration of the font engine
// Shows all features including Thai script, kerning, variation, and performance

import React, { useState, useMemo } from 'react'
import FontEngine, { QuickFontEngine, FONT_ENGINE_PRESETS, useFontEngine } from '../FontEngine.jsx'
import { globalGlyphCache } from '../Glyph.js'
import { parseGraphemeClustersWithMetadata } from '../GraphemeCluster.js'
import { layoutEngine } from '../LayoutEngine.js'

// Demo component showing all font engine features
export default function FontEngineDemo() {
  const [text, setText] = useState('สวัสดีครับ\nHello World!\nทดสอบภาษาไทย')
  const [fontSize, setFontSize] = useState(48)
  const [selectedPreset, setSelectedPreset] = useState('natural')
  const [showDebug, setShowDebug] = useState(false)
  const [seed, setSeed] = useState(Math.random())

  // Custom configuration
  const customConfig = useMemo(() => ({
    letterSpacing: 0,
    lineHeight: 1.2,
    maxWidth: Infinity,
    kerning: true,
    variation: {
      enabled: true,
      preset: 'natural',
      seed: seed,
    },
    strokeColor: '#2C2416',
    strokeWidth: 2,
    fillColor: 'none',
    className: 'handwriting-text',
  }), [seed])

  // Hook example
  const { renderText, renderJSX } = useFontEngine(customConfig)

  // Examples for different features
  const examples = useMemo(() => [
    {
      title: 'Basic Thai Text',
      text: 'สวัสดีครับ',
      description: 'Simple Thai text with default settings',
      preset: 'natural',
    },
    {
      title: 'Thai with Tone Marks',
      text: 'การเรียนรู้',
      description: 'Thai text with various tone marks and combining characters',
      preset: 'natural',
    },
    {
      title: 'Complex Clusters',
      text: 'เก้าสิบหก',
      description: 'Complex Thai grapheme clusters with multiple combining marks',
      preset: 'natural',
    },
    {
      title: 'Mixed Script',
      text: 'สวัสดี Hello ทุกคน',
      description: 'Mixed Thai and English text',
      preset: 'natural',
    },
    {
      title: 'Formal Style',
      text: 'การเขียนแบบเป็นทางการ',
      description: 'Formal writing style with subtle variation',
      preset: 'formal',
    },
    {
      title: 'Artistic Style',
      text: 'ลายมือสวยงาม',
      description: 'Artistic handwriting with expressive variation',
      preset: 'artistic',
    },
    {
      title: 'Technical Style',
      text: 'TECHNICAL DRAWING',
      description: 'Technical drawing style with minimal variation',
      preset: 'technical',
    },
    {
      title: 'Bold Style',
      text: 'ตัวหนา',
      description: 'Bold handwriting style',
      preset: 'bold',
    },
    {
      title: 'Multi-line Text',
      text: 'บรรทัดที่ 1\nบรรทัดที่ 2\nบรรทัดที่ 3',
      description: 'Multi-line text with proper line spacing',
      preset: 'natural',
    },
    {
      title: 'Custom Colors',
      text: 'สีสันสดใส',
      description: 'Custom stroke colors and styling',
      preset: 'natural',
      customConfig: {
        strokeColor: '#e74c3c',
        strokeWidth: 3,
      },
    },
  ], [])

  // Grapheme cluster analysis
  const clusterAnalysis = useMemo(() => {
    return parseGraphemeClustersWithMetadata(text)
  }, [text])

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <h1>Font Engine Demo - Production-Grade Handwriting System</h1>
      
      {/* Interactive Editor */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Interactive Editor</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '20px',
          marginBottom: '20px',
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Text:
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                width: '100%',
                height: '100px',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'monospace',
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Font Size: {fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="120"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            
            <label style={{ display: 'block', marginBottom: '5px', marginTop: '10px' }}>
              Preset:
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              style={{ width: '100%', padding: '5px' }}
            >
              {Object.keys(FONT_ENGINE_PRESETS).map(preset => (
                <option key={preset} value={preset}>{preset}</option>
              ))}
            </select>
            
            <label style={{ display: 'block', marginBottom: '5px', marginTop: '10px' }}>
              Seed (for consistent variation):
            </label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              style={{ width: '100%', padding: '5px' }}
              step="0.1"
            />
            
            <label style={{ display: 'block', marginBottom: '5px', marginTop: '10px' }}>
              <input
                type="checkbox"
                checked={showDebug}
                onChange={(e) => setShowDebug(e.target.checked)}
              />
              Show Debug Info
            </label>
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          textAlign: 'center',
          marginBottom: '20px',
        }}>
          <FontEngine
            text={text}
            fontSize={fontSize}
            config={FONT_ENGINE_PRESETS[selectedPreset]}
          />
        </div>

        {showDebug && (
          <div style={{
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#f0f0f0',
            fontSize: '14px',
            fontFamily: 'monospace',
          }}>
            <h3>Debug Information</h3>
            <p><strong>Text:</strong> {text}</p>
            <p><strong>Font Size:</strong> {fontSize}px</p>
            <p><strong>Preset:</strong> {selectedPreset}</p>
            <p><strong>Seed:</strong> {seed}</p>
            <p><strong>Grapheme Clusters:</strong> {clusterAnalysis.length}</p>
            <div>
              <strong>Cluster Breakdown:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {clusterAnalysis.map((cluster, index) => (
                  <li key={index}>
                    "{cluster.text}" ({cluster.type}) 
                    {cluster.hasCombiningMarks && ' - has marks'}
                    {cluster.isThai && ' - Thai'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Examples Gallery */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Examples Gallery</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '20px',
        }}>
          {examples.map((example, index) => (
            <div
              key={index}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fff',
              }}
            >
              <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>
                {example.title}
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>
                {example.description}
              </p>
              <div style={{
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                textAlign: 'center',
                minHeight: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}>
                <QuickFontEngine
                  text={example.text}
                  fontSize={32}
                  preset={example.preset}
                  config={example.customConfig}
                />
              </div>
              <p style={{
                margin: '0',
                fontSize: '11px',
                color: '#888',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}>
                {example.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* API Examples */}
      <section style={{ marginBottom: '40px' }}>
        <h2>API Examples</h2>
        
        <div style={{ marginBottom: '30px' }}>
          <h3>Hook Usage</h3>
          <div style={{
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#f8f9fa',
          }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>SVG String Output:</strong>
            </div>
            <div style={{
              padding: '10px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              maxHeight: '100px',
              overflow: 'auto',
            }}>
              {renderText('Hook Example', 24)}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3>Available Glyphs</h3>
          <div style={{
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#f8f9fa',
          }}>
            <p>Total glyphs in cache: {globalGlyphCache.getCharacters().length}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {globalGlyphCache.getCharacters().map(char => (
                <div
                  key={char}
                  style={{
                    padding: '5px 10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    fontSize: '12px',
                  }}
                >
                  {char === ' ' ? '[space]' : char === '\n' ? '[newline]' : char}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3>Performance Features</h3>
          <ul>
            <li><strong>React.memo</strong> - Components are memoized to prevent unnecessary re-renders</li>
            <li><strong>useMemo</strong> - Expensive calculations (layout, variation) are cached</li>
            <li><strong>useCallback</strong> - Function references are stable across renders</li>
            <li><strong>Glyph Cache</strong> - Glyph data is cached for fast lookup</li>
            <li><strong>Variation Cache</strong> - Variation calculations are cached per character instance</li>
            <li><strong>Lazy Rendering</strong> - SVG generation only happens when needed</li>
          </ul>
        </div>
      </section>

      {/* Advanced Features */}
      <section>
        <h2>Advanced Features</h2>
        
        <div style={{ marginBottom: '30px' }}>
          <h3>Font Engine Architecture</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
          }}>
            <div style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa',
            }}>
              <h4>Glyph System</h4>
              <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '12px' }}>
                <li>1000 units/em coordinate system</li>
                <li>Proper baseline alignment</li>
                <li>Anchor-based positioning</li>
                <li>Advance width & bearings</li>
              </ul>
            </div>
            
            <div style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa',
            }}>
              <h4>Layout Engine</h4>
              <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '12px' }}>
                <li>Grapheme cluster parsing</li>
                <li>Kerning pair support</li>
                <li>Multi-line layout</li>
                <li>Text wrapping</li>
              </ul>
            </div>
            
            <div style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa',
            }}>
              <h4>Variation System</h4>
              <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '12px' }}>
                <li>Seeded randomness</li>
                <li>Consistent variation</li>
                <li>Multiple presets</li>
                <li>Character-specific</li>
              </ul>
            </div>
            
            <div style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa',
            }}>
              <h4>Rendering</h4>
              <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '12px' }}>
                <li>Pure SVG output</li>
                <li>Path optimization</li>
                <li>Accessibility support</li>
                <li>JSX generation</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3>Thai Script Support</h3>
          <p>The font engine properly handles Thai script with:</p>
          <ul>
            <li><strong>Grapheme Clusters:</strong> Proper Unicode segmentation for Thai characters</li>
            <li><strong>Anchor Positioning:</strong> Combining marks attach to base characters using anchor points</li>
            <li><strong>Kerning Pairs:</strong> Thai-specific kerning for natural spacing</li>
            <li><strong>Mark Ordering:</strong> Correct rendering order for tone marks and vowels</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

// Export individual example components for testing
export function BasicExample() {
  return (
    <FontEngine
      text="สวัสดีครับ"
      fontSize={48}
      config={FONT_ENGINE_PRESETS.natural}
    />
  )
}

export function ThaiComplexExample() {
  return (
    <FontEngine
      text="การเรียนรู้ภาษาไทย"
      fontSize={42}
      config={FONT_ENGINE_PRESETS.formal}
    />
  )
}

export function MultilineExample() {
  return (
    <FontEngine
      text="บรรทัดที่ 1\nบรรทัดที่ 2\nบรรทัดที่ 3"
      fontSize={36}
      config={FONT_ENGINE_PRESETS.natural}
    />
  )
}

export function CustomStyleExample() {
  return (
    <FontEngine
      text="ลายมือสวยงาม"
      fontSize={48}
      config={{
        letterSpacing: 2,
        lineHeight: 1.4,
        kerning: false,
        variation: {
          enabled: true,
          preset: 'expressive',
          seed: 12345,
        },
        strokeColor: '#e74c3c',
        strokeWidth: 3,
        fillColor: 'none',
      }}
    />
  )
}
