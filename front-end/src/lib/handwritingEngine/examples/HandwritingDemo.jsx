// HandwritingDemo.jsx - Complete example demonstrating the handwriting rendering engine
// Shows various use cases, configurations, and features

import React, { useState, useMemo } from 'react'
import HandwritingText, { QuickHandwriting, HandwritingPresets, useHandwritingEngine } from '../HandwritingText.jsx'
import { glyphCache } from '../glyphData.js'

// Demo component showing different usage patterns
export default function HandwritingDemo() {
  const [text, setText] = useState('สวัสดีครับ\nHello World!\nทดสอบภาษาไทย')
  const [fontSize, setFontSize] = useState(48)
  const [selectedPreset, setSelectedPreset] = useState('natural')
  const [customConfig, setCustomConfig] = useState({
    letterSpacing: 0,
    lineHeight: 1.2,
    scale: 1.0,
    strokeColor: '#2C2416',
    strokeWidth: 2,
    fillColor: 'none',
  })

  // Custom hook example
  const { renderText, engine } = useHandwritingEngine(customConfig)

  // Examples of different text samples
  const examples = useMemo(() => [
    {
      title: 'Basic Thai Text',
      text: 'สวัสดีครับ',
      preset: 'natural',
    },
    {
      title: 'Mixed Thai and English',
      text: 'สวัสดี Hello ทุกคน',
      preset: 'natural',
    },
    {
      title: 'Bold Style',
      text: 'ตัวหนา',
      preset: 'bold',
    },
    {
      title: 'Light Style',
      text: 'ตัวบาง',
      preset: 'light',
    },
    {
      title: 'Cursive Style',
      text: 'ลายมือ',
      preset: 'cursive',
    },
    {
      title: 'Compact Style',
      text: 'กระชับ',
      preset: 'compact',
    },
    {
      title: 'Multi-line Text',
      text: 'บรรทัดที่ 1\nบรรทัดที่ 2\nบรรทัดที่ 3',
      preset: 'natural',
    },
    {
      title: 'With Custom Colors',
      text: 'สีสัน',
      preset: 'natural',
      customConfig: {
        strokeColor: '#e74c3c',
        strokeWidth: 3,
      },
    },
  ], [])

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <h1>Handwriting Rendering Engine Demo</h1>
      
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
              {Object.keys(HandwritingPresets).map(preset => (
                <option key={preset} value={preset}>{preset}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          textAlign: 'center',
        }}>
          <HandwritingText
            text={text}
            fontSize={fontSize}
            config={HandwritingPresets[selectedPreset]}
          />
        </div>
      </section>

      {/* Custom Configuration */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Custom Configuration</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          marginBottom: '20px',
        }}>
          <div>
            <label>Letter Spacing: {customConfig.letterSpacing}px</label>
            <input
              type="range"
              min="-5"
              max="10"
              step="0.5"
              value={customConfig.letterSpacing}
              onChange={(e) => setCustomConfig(prev => ({
                ...prev,
                letterSpacing: Number(e.target.value)
              }))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Line Height: {customConfig.lineHeight}</label>
            <input
              type="range"
              min="0.8"
              max="2"
              step="0.1"
              value={customConfig.lineHeight}
              onChange={(e) => setCustomConfig(prev => ({
                ...prev,
                lineHeight: Number(e.target.value)
              }))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Scale: {customConfig.scale}</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={customConfig.scale}
              onChange={(e) => setCustomConfig(prev => ({
                ...prev,
                scale: Number(e.target.value)
              }))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Stroke Width: {customConfig.strokeWidth}px</label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={customConfig.strokeWidth}
              onChange={(e) => setCustomConfig(prev => ({
                ...prev,
                strokeWidth: Number(e.target.value)
              }))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label>Stroke Color:</label>
            <input
              type="color"
              value={customConfig.strokeColor}
              onChange={(e) => setCustomConfig(prev => ({
                ...prev,
                strokeColor: e.target.value
              }))}
              style={{ width: '100%', height: '30px' }}
            />
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          border: '2px solid #e74c3c',
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          textAlign: 'center',
        }}>
          <HandwritingText
            text="Custom Configuration"
            fontSize={fontSize}
            config={customConfig}
          />
        </div>
      </section>

      {/* Examples Gallery */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Examples Gallery</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                {example.title}
              </h3>
              <div style={{
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                textAlign: 'center',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <QuickHandwriting
                  text={example.text}
                  fontSize={32}
                  preset={example.preset}
                  config={example.customConfig}
                />
              </div>
              <p style={{
                margin: '10px 0 0 0',
                fontSize: '12px',
                color: '#666',
                fontFamily: 'monospace',
              }}>
                {example.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Engine API Demo */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Engine API Demo</h2>
        <div style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa',
        }}>
          <h3>Direct Engine Usage</h3>
          <p style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            {renderText('Direct API Call', 36)}
          </p>
          
          <h3>Available Glyphs</h3>
          <p>Total glyphs in cache: {Object.keys(glyphCache.getAllGlyphs()).length}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Object.keys(glyphCache.getAllGlyphs()).map(char => (
              <div
                key={char}
                style={{
                  padding: '5px 10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                }}
              >
                <QuickHandwriting text={char} fontSize={24} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Notes */}
      <section>
        <h2>Performance Features</h2>
        <ul>
          <li><strong>React.memo</strong> - Components are memoized to prevent unnecessary re-renders</li>
          <li><strong>useMemo</strong> - Expensive calculations are cached</li>
          <li><strong>useCallback</strong> - Function references are stable</li>
          <li><strong>Glyph Cache</strong> - Glyph data is cached for fast lookup</li>
          <li><strong>Lazy Calculation</strong> - SVG dimensions and paths are calculated only when needed</li>
        </ul>
      </section>
    </div>
  )
}

// Export individual example components for testing
export function BasicExample() {
  return (
    <HandwritingText
      text="สวัสดีครับ"
      fontSize={48}
      config={HandwritingPresets.natural}
    />
  )
}

export function MultilineExample() {
  return (
    <HandwritingText
      text="บรรทัดที่ 1\nบรรทัดที่ 2\nบรรทัดที่ 3"
      fontSize={36}
      config={HandwritingPresets.natural}
    />
  )
}

export function CustomStyleExample() {
  return (
    <HandwritingText
      text="ลายมือสวยงาม"
      fontSize={42}
      config={{
        letterSpacing: 2,
        lineHeight: 1.4,
        scale: 1.1,
        strokeColor: '#e74c3c',
        strokeWidth: 2.5,
        fillColor: 'none',
      }}
    />
  )
}
