// HandwritingText.jsx - React component for rendering handwriting text
// Production-ready with memoization and TypeScript support

import React, { memo, useMemo, useCallback, forwardRef } from 'react'
import { createHandwritingEngine } from './renderingEngine.js'

// Configuration interface
export const HandwritingTextConfig = {
  letterSpacing: 0,
  lineHeight: 1.2,
  scale: 1.0,
  strokeColor: '#2C2416',
  strokeWidth: 2,
  fillColor: 'none',
  seed: Math.random(),
  maxWidth: Infinity,
  className: '',
  style: {},
}

// Internal component with memoization
const HandwritingTextInner = memo(forwardRef(({
  text = '',
  fontSize = 48,
  config = {},
  className = '',
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...props
}, ref) => {
  // Merge configuration with defaults
  const finalConfig = useMemo(() => ({
    ...HandwritingTextConfig,
    ...config,
    className: `${HandwritingTextConfig.className} ${className}`.trim(),
  }), [config, className])

  // Create engine instance with memoization
  const engine = useMemo(() => {
    return createHandwritingEngine(finalConfig)
  }, [
    finalConfig.letterSpacing,
    finalConfig.lineHeight,
    finalConfig.scale,
    finalConfig.strokeColor,
    finalConfig.strokeWidth,
    finalConfig.fillColor,
    finalConfig.seed,
    finalConfig.maxWidth,
  ])

  // Layout glyphs with memoization
  const glyphs = useMemo(() => {
    if (!text) return []
    return engine.layout.layoutGlyphs(text, fontSize, finalConfig.maxWidth)
  }, [engine, text, fontSize, finalConfig.maxWidth])

  // Calculate SVG dimensions with memoization
  const svgDimensions = useMemo(() => {
    if (glyphs.length === 0) {
      return { width: 0, height: 0, viewBox: '0 0 0 0' }
    }

    // Calculate bounds from positioned glyphs
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    glyphs.forEach(({ transformed, variation }) => {
      const x = variation?.x || transformed.x
      const y = variation?.y || transformed.y
      const scale = (variation?.scale || transformed.scale) * 50 // Rough estimate

      minX = Math.min(minX, x - scale)
      minY = Math.min(minY, y - scale)
      maxX = Math.max(maxX, x + transformed.advanceWidth + scale)
      maxY = Math.max(maxY, y + scale)
    })

    const width = maxX - minX
    const height = maxY - minY
    const padding = 20

    return {
      width: width + padding * 2,
      height: height + padding * 2,
      viewBox: `${-padding} ${-padding} ${width + padding * 2} ${height + padding * 2}`,
    }
  }, [glyphs])

  // Generate individual glyph paths with memoization
  const glyphPaths = useMemo(() => {
    return glyphs.map(({ glyph, transformed, variation }, index) => {
      const { x, y, scale, path } = transformed
      const { rotation = 0, scale: variationScale = 1 } = variation || {}
      
      const finalScale = scale * variationScale
      const transform = `translate(${x}, ${y}) scale(${finalScale}) rotate(${rotation})`

      return {
        key: `${glyph.char}-${index}`,
        d: path,
        transform,
        char: glyph.char,
      }
    })
  }, [glyphs])

  // Handle empty text
  if (!text || glyphs.length === 0) {
    return null
  }

  return (
    <svg
      ref={ref}
      width={svgDimensions.width}
      height={svgDimensions.height}
      viewBox={svgDimensions.viewBox}
      className={finalConfig.className}
      style={{
        display: 'inline-block',
        verticalAlign: 'bottom',
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      <g>
        {glyphPaths.map(({ key, d, transform, char }) => (
          <path
            key={key}
            d={d}
            transform={transform}
            stroke={finalConfig.strokeColor}
            strokeWidth={finalConfig.strokeWidth}
            fill={finalConfig.fillColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-label={char}
            role="img"
          />
        ))}
      </g>
    </svg>
  )
}))

HandwritingTextInner.displayName = 'HandwritingTextInner'

// Main component with additional features
const HandwritingText = memo(({
  text,
  fontSize = 48,
  config = {},
  onTextChange,
  onConfigChange,
  editable = false,
  ...props
}) => {
  // Handle editable mode
  if (editable) {
    return (
      <div style={{ display: 'inline-block' }}>
        <HandwritingTextInner
          text={text}
          fontSize={fontSize}
          config={config}
          {...props}
        />
        {onTextChange && (
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            style={{
              position: 'absolute',
              left: -9999,
              opacity: 0,
              pointerEvents: 'none',
            }}
            aria-label="Handwriting text input"
          />
        )}
      </div>
    )
  }

  return (
    <HandwritingTextInner
      text={text}
      fontSize={fontSize}
      config={config}
      {...props}
    />
  )
})

HandwritingText.displayName = 'HandwritingText'

// Export both components
export default HandwritingText
export { HandwritingTextInner }

// Hook for using handwriting engine in functional components
export function useHandwritingEngine(config = {}) {
  const engine = useMemo(() => createHandwritingEngine(config), [
    config.letterSpacing,
    config.lineHeight,
    config.scale,
    config.strokeColor,
    config.strokeWidth,
    config.fillColor,
    config.seed,
    config.maxWidth,
  ])

  const renderText = useCallback((text, fontSize = 48) => {
    return engine.renderToSVG(text, fontSize)
  }, [engine])

  const renderJSX = useCallback((text, fontSize = 48) => {
    return engine.renderToJSX(text, fontSize)
  }, [engine])

  return {
    engine,
    renderText,
    renderJSX,
    updateConfig: useCallback((newConfig) => {
      engine.updateOptions(newConfig)
    }, [engine]),
  }
}

// Utility functions for common use cases
export const HandwritingPresets = {
  // Natural handwriting with subtle variation
  natural: {
    letterSpacing: 0,
    lineHeight: 1.2,
    scale: 1.0,
    strokeColor: '#2C2416',
    strokeWidth: 2,
    fillColor: 'none',
    seed: Math.random(),
  },

  // Bold handwriting
  bold: {
    letterSpacing: 0,
    lineHeight: 1.2,
    scale: 1.0,
    strokeColor: '#2C2416',
    strokeWidth: 3,
    fillColor: 'none',
    seed: Math.random(),
  },

  // Light handwriting
  light: {
    letterSpacing: 0,
    lineHeight: 1.2,
    scale: 1.0,
    strokeColor: '#2C2416',
    strokeWidth: 1,
    fillColor: 'none',
    seed: Math.random(),
  },

  // Cursive style with more variation
  cursive: {
    letterSpacing: 2,
    lineHeight: 1.3,
    scale: 1.0,
    strokeColor: '#2C2416',
    strokeWidth: 2.5,
    fillColor: 'none',
    seed: Math.random(),
  },

  // Compact style
  compact: {
    letterSpacing: -2,
    lineHeight: 1.1,
    scale: 0.9,
    strokeColor: '#2C2416',
    strokeWidth: 2,
    fillColor: 'none',
    seed: Math.random(),
  },
}

// Quick render function for simple use cases
export function QuickHandwriting({ text, fontSize = 48, preset = 'natural', ...props }) {
  const config = HandwritingPresets[preset] || HandwritingPresets.natural
  return (
    <HandwritingText
      text={text}
      fontSize={fontSize}
      config={config}
      {...props}
    />
  )
}
