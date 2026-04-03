// FontEngine.jsx - Production-grade React component for handwriting font rendering
// Implements a complete OpenType-like font engine with Thai script support

import React, { memo, useMemo, useCallback, forwardRef } from 'react'
import { LayoutEngine } from './LayoutEngine.js'
import { HandwritingVariation, VARIATION_PRESETS } from './HandwritingVariation.js'
import { SVGRenderer } from './SVGRenderer.js'
import { coordinateSystem } from './CoordinateSystem.js'

/**
 * Default font engine configuration
 */
export const DEFAULT_CONFIG = {
  // Layout options
  letterSpacing: 0,
  lineHeight: 1.2,
  maxWidth: Infinity,
  kerning: true,
  
  // Variation options
  variation: {
    enabled: false, // CRITICAL FIX: Disable randomness by default
    preset: 'natural',
    seed: 42, // Fixed seed for determinism
  },
  
  // Rendering options
  strokeColor: '#2C2416',
  strokeWidth: 2,
  fillColor: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'handwriting-text',
  ariaLabel: true,
  optimizePaths: true,
  padding: 20,
}

/**
 * Memoized glyph rendering component
 */
const GlyphRenderer = memo(({ positionedGlyphs, fontSize, config }) => {
  const svgStructure = useMemo(() => {
    const renderer = new SVGRenderer({
      strokeColor: config.strokeColor,
      strokeWidth: config.strokeWidth,
      fillColor: config.fillColor,
      strokeLinecap: config.strokeLinecap,
      strokeLinejoin: config.strokeLinejoin,
      className: config.className,
      ariaLabel: config.ariaLabel,
      optimizePaths: config.optimizePaths,
      padding: config.padding,
    })
    
    return renderer.renderToJSX(positionedGlyphs, fontSize)
  }, [positionedGlyphs, fontSize, config])
  
  if (!svgStructure) return null
  
  // Convert JSX structure to actual React elements
  const renderJSXElement = (element) => {
    if (typeof element === 'string') return element
    
    const { type, props, children } = element
    const childrenElements = children ? children.map(renderJSXElement) : []
    
    return React.createElement(type, props, ...childrenElements)
  }
  
  return renderJSXElement(svgStructure)
})

GlyphRenderer.displayName = 'GlyphRenderer'

/**
 * Main FontEngine component
 */
const FontEngine = memo(forwardRef(({
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
    ...DEFAULT_CONFIG,
    ...config,
    className: `${DEFAULT_CONFIG.className} ${className}`.trim(),
  }), [config, className])
  
  // Create engines with memoization
  const layoutEngine = useMemo(() => {
    return new LayoutEngine({
      letterSpacing: finalConfig.letterSpacing,
      lineHeight: finalConfig.lineHeight,
      maxWidth: finalConfig.maxWidth,
      kerning: finalConfig.kerning,
    })
  }, [
    finalConfig.letterSpacing,
    finalConfig.lineHeight,
    finalConfig.maxWidth,
    finalConfig.kerning,
  ])
  
  const variationEngine = useMemo(() => {
    return new HandwritingVariation({
      ...finalConfig.variation,
      enabled: finalConfig.variation.enabled,
    })
  }, [
    finalConfig.variation.enabled,
    finalConfig.variation.preset,
    finalConfig.variation.seed,
  ])
  
  // Layout text with memoization
  const positionedGlyphs = useMemo(() => {
    if (!text) return []
    
    const glyphs = layoutEngine.layoutText(text, fontSize)
    
    // Apply variation if enabled
    if (finalConfig.variation.enabled) {
      return variationEngine.applyVariationToGlyphs(glyphs)
    }
    
    return glyphs
  }, [
    text,
    fontSize,
    layoutEngine,
    variationEngine,
    finalConfig.variation.enabled,
  ])
  
  // Calculate container dimensions with memoization
  const containerDimensions = useMemo(() => {
    if (positionedGlyphs.length === 0) {
      return { width: 0, height: 0 }
    }
    
    const bounds = coordinateSystem.getTextBounds(positionedGlyphs, fontSize)
    const padding = finalConfig.padding
    
    return {
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2,
    }
  }, [positionedGlyphs, fontSize, finalConfig.padding])
  
  // Handle empty text
  if (!text || positionedGlyphs.length === 0) {
    return null
  }
  
  return (
    <div
      ref={ref}
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
      <GlyphRenderer
        positionedGlyphs={positionedGlyphs}
        fontSize={fontSize}
        config={finalConfig}
      />
    </div>
  )
}))

FontEngine.displayName = 'FontEngine'

/**
 * Hook for using font engine directly
 */
export function useFontEngine(config = {}) {
  const finalConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config])
  
  const layoutEngine = useMemo(() => {
    return new LayoutEngine({
      letterSpacing: finalConfig.letterSpacing,
      lineHeight: finalConfig.lineHeight,
      maxWidth: finalConfig.maxWidth,
      kerning: finalConfig.kerning,
    })
  }, [
    finalConfig.letterSpacing,
    finalConfig.lineHeight,
    finalConfig.maxWidth,
    finalConfig.kerning,
  ])
  
  const variationEngine = useMemo(() => {
    return new HandwritingVariation({
      ...finalConfig.variation,
      enabled: finalConfig.variation.enabled,
    })
  }, [
    finalConfig.variation.enabled,
    finalConfig.variation.preset,
    finalConfig.variation.seed,
  ])
  
  const svgRenderer = useMemo(() => {
    return new SVGRenderer({
      strokeColor: finalConfig.strokeColor,
      strokeWidth: finalConfig.strokeWidth,
      fillColor: finalConfig.fillColor,
      strokeLinecap: finalConfig.strokeLinecap,
      strokeLinejoin: finalConfig.strokeLinejoin,
      className: finalConfig.className,
      ariaLabel: finalConfig.ariaLabel,
      optimizePaths: finalConfig.optimizePaths,
      padding: finalConfig.padding,
    })
  }, [
    finalConfig.strokeColor,
    finalConfig.strokeWidth,
    finalConfig.fillColor,
    finalConfig.strokeLinecap,
    finalConfig.strokeLinejoin,
    finalConfig.className,
    finalConfig.ariaLabel,
    finalConfig.optimizePaths,
    finalConfig.padding,
  ])
  
  const renderText = useCallback((text, fontSize = 48) => {
    if (!text) return ''
    
    const glyphs = layoutEngine.layoutText(text, fontSize)
    const variedGlyphs = finalConfig.variation.enabled 
      ? variationEngine.applyVariationToGlyphs(glyphs)
      : glyphs
    
    return svgRenderer.renderToSVG(variedGlyphs, fontSize)
  }, [layoutEngine, variationEngine, svgRenderer, finalConfig.variation.enabled])
  
  const renderJSX = useCallback((text, fontSize = 48) => {
    if (!text) return null
    
    const glyphs = layoutEngine.layoutText(text, fontSize)
    const variedGlyphs = finalConfig.variation.enabled 
      ? variationEngine.applyVariationToGlyphs(glyphs)
      : glyphs
    
    return svgRenderer.renderToJSX(variedGlyphs, fontSize)
  }, [layoutEngine, variationEngine, svgRenderer, finalConfig.variation.enabled])
  
  return {
    layoutEngine,
    variationEngine,
    svgRenderer,
    renderText,
    renderJSX,
    updateConfig: useCallback((newConfig) => {
      // This would require re-creating engines, so it's not fully implemented
      // Users should create a new hook instance with new config
      console.warn('updateConfig not implemented - create new hook instance instead')
    }, []),
  }
}

/**
 * Preset configurations for common use cases
 */
export const FONT_ENGINE_PRESETS = {
  // Natural handwriting
  natural: {
    letterSpacing: 0,
    lineHeight: 1.2,
    kerning: true,
    variation: {
      enabled: false, // CRITICAL FIX: Disable randomness by default
      preset: 'natural',
      seed: 42, // Fixed seed for determinism
    },
    strokeColor: '#2C2416',
    strokeWidth: 2,
  },
  
  // Formal writing
  formal: {
    letterSpacing: 0,
    lineHeight: 1.3,
    kerning: true,
    variation: {
      enabled: false, // CRITICAL FIX: Disable randomness by default
      preset: 'subtle',
      seed: 42, // Fixed seed for determinism
    },
    strokeColor: '#1a1a1a',
    strokeWidth: 1.5,
  },
  
  // Artistic writing
  artistic: {
    letterSpacing: 1,
    lineHeight: 1.4,
    kerning: false,
    variation: {
      enabled: false, // CRITICAL FIX: Disable randomness by default
      preset: 'expressive',
      seed: 42, // Fixed seed for determinism
    },
    strokeColor: '#2C2416',
    strokeWidth: 2.5,
  },
  
  // Technical drawing
  technical: {
    letterSpacing: -1,
    lineHeight: 1.1,
    kerning: true,
    variation: {
      enabled: false, // CRITICAL FIX: Disable randomness by default
      preset: 'minimal',
      seed: 42, // Fixed seed for determinism
    },
    strokeColor: '#333333',
    strokeWidth: 1,
  },
  
  // Bold writing
  bold: {
    letterSpacing: 0,
    lineHeight: 1.2,
    kerning: true,
    variation: {
      enabled: false, // CRITICAL FIX: Disable randomness by default
      preset: 'natural',
      seed: 42, // Fixed seed for determinism
    },
    strokeColor: '#2C2416',
    strokeWidth: 3,
  },
}

/**
 * Quick render component with presets
 */
export const QuickFontEngine = memo(({ text, fontSize = 48, preset = 'natural', ...props }) => {
  const config = FONT_ENGINE_PRESETS[preset] || FONT_ENGINE_PRESETS.natural
  
  return (
    <FontEngine
      text={text}
      fontSize={fontSize}
      config={config}
      {...props}
    />
  )
})

QuickFontEngine.displayName = 'QuickFontEngine'

// Export main component and utilities
export default FontEngine
export { VARIATION_PRESETS }
