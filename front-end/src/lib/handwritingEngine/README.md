# Handwriting Rendering Engine

A production-ready SVG-based handwriting rendering engine for React applications. Simulates real font behavior using vector paths instead of images.

## Features

- ✅ **Pure SVG Rendering** - No images, only vector paths
- ✅ **Consistent Coordinate System** - Baseline, ascent, descent alignment
- ✅ **Natural Handwriting Variation** - Random offsets and rotation
- ✅ **Thai Script Support** - Proper grapheme cluster handling
- ✅ **Configurable** - Letter spacing, line height, scale, colors
- ✅ **Line Wrapping** - Automatic text wrapping
- ✅ **Performance Optimized** - React memoization and caching
- ✅ **TypeScript Ready** - Full type support
- ✅ **Production Ready** - Scalable for thousands of glyphs

## Quick Start

```jsx
import HandwritingText from './lib/handwritingEngine/HandwritingText.jsx'

function App() {
  return (
    <HandwritingText
      text="สวัสดีครับ"
      fontSize={48}
      config={{
        letterSpacing: 0,
        lineHeight: 1.2,
        scale: 1.0,
        strokeColor: '#2C2416',
        strokeWidth: 2,
      }}
    />
  )
}
```

## Core Concepts

### Glyph Structure

Each character is defined as:

```js
{
  char: "ก",
  path: "M10 10 Q 50 0 90 10 ...",
  advanceWidth: 48,
  offsetX: 0,
  offsetY: 0,
  ascent: 800,
  descent: 0,
}
```

### Coordinate System

- **Units per Em**: 1000 (standard font units)
- **Ascent**: 800 units above baseline
- **Descent**: -200 units below baseline
- **Baseline**: 0 units (reference line)

## API Reference

### HandwritingText Component

Main React component for rendering handwriting text.

#### Props

```jsx
<HandwritingText
  text="สวัสดีครับ"           // Text to render
  fontSize={48}                // Font size in pixels
  config={{                    // Configuration object
    letterSpacing: 0,          // Letter spacing in pixels
    lineHeight: 1.2,           // Line height multiplier
    scale: 1.0,               // Global scale
    strokeColor: '#2C2416',    // Stroke color
    strokeWidth: 2,            // Stroke width
    fillColor: 'none',         // Fill color
    seed: Math.random(),       // Random seed for variation
    maxWidth: Infinity,        // Maximum width for wrapping
  }}
  className="custom-class"      // CSS class
  style={{}}                   // Inline styles
  onClick={handleClick}        // Event handlers
/>
```

### QuickHandwriting Component

Simplified component for common use cases:

```jsx
import { QuickHandwriting } from './HandwritingText.jsx'

<QuickHandwriting
  text="Hello"
  fontSize={32}
  preset="natural"  // 'natural', 'bold', 'light', 'cursive', 'compact'
/>
```

### useHandwritingEngine Hook

Access the underlying engine directly:

```jsx
import { useHandwritingEngine } from './HandwritingText.jsx'

function MyComponent() {
  const { renderText, renderJSX, engine } = useHandwritingEngine({
    strokeColor: '#e74c3c',
    strokeWidth: 3,
  })

  const svgString = renderText('Hello', 48)
  const jsxElement = renderJSX('World', 36)

  return <div dangerouslySetInnerHTML={{ __html: svgString }} />
}
```

## Configuration Presets

### Natural (Default)
```js
{
  letterSpacing: 0,
  lineHeight: 1.2,
  scale: 1.0,
  strokeColor: '#2C2416',
  strokeWidth: 2,
  fillColor: 'none',
}
```

### Bold
```js
{
  letterSpacing: 0,
  lineHeight: 1.2,
  scale: 1.0,
  strokeColor: '#2C2416',
  strokeWidth: 3,
  fillColor: 'none',
}
```

### Light
```js
{
  letterSpacing: 0,
  lineHeight: 1.2,
  scale: 1.0,
  strokeColor: '#2C2416',
  strokeWidth: 1,
  fillColor: 'none',
}
```

### Cursive
```js
{
  letterSpacing: 2,
  lineHeight: 1.3,
  scale: 1.0,
  strokeColor: '#2C2416',
  strokeWidth: 2.5,
  fillColor: 'none',
}
```

### Compact
```js
{
  letterSpacing: -2,
  lineHeight: 1.1,
  scale: 0.9,
  strokeColor: '#2C2416',
  strokeWidth: 2,
  fillColor: 'none',
}
```

## Advanced Usage

### Custom Glyphs

Add your own glyphs to the cache:

```js
import { glyphCache } from './lib/handwritingEngine/glyphData.js'

glyphCache.set('ฤ', {
  char: 'ฤ',
  path: 'M 100 800 Q 200 600 300 400...',
  advanceWidth: 600,
  offsetX: 0,
  offsetY: 0,
  ascent: 800,
  descent: 0,
})
```

### Load Glyphs from JSON

```js
import { glyphCache } from './lib/handwritingEngine/glyphData.js'

const glyphData = {
  'ก': { char: 'ก', path: '...', advanceWidth: 580, ... },
  'ข': { char: 'ข', path: '...', advanceWidth: 680, ... },
}

glyphCache.loadFromJSON(glyphData)
```

### Direct Engine Usage

```js
import { createHandwritingEngine } from './lib/handwritingEngine/renderingEngine.js'

const engine = createHandwritingEngine({
  strokeColor: '#e74c3c',
  strokeWidth: 3,
})

// Render to SVG string
const svgString = engine.renderToSVG('Hello World', 48)

// Render to React element
const jsxElement = engine.renderToJSX('Hello World', 48)
```

## Performance Optimization

### React Memoization

The engine uses multiple layers of memoization:

1. **Component Memoization** - `React.memo` prevents unnecessary re-renders
2. **Calculation Caching** - `useMemo` caches expensive calculations
3. **Function Stability** - `useCallback` maintains stable function references
4. **Glyph Caching** - Glyph lookup is cached for fast access

### Best Practices

1. **Use Stable Configs** - Avoid changing configuration props frequently
2. **Memoize Text** - For dynamic text, use `useMemo` to prevent re-layout
3. **Batch Updates** - Group multiple configuration changes
4. **Use Presets** - Predefined presets are optimized

```jsx
// Good: Stable configuration
const config = useMemo(() => ({ preset: 'natural' }), [])

// Good: Memoized text
const displayText = useMemo(() => generateText(), [data])

// Good: Batch updates
const updateConfig = () => {
  setConfig(prev => ({ ...prev, fontSize: 48, strokeWidth: 3 }))
}
```

## Thai Script Support

The engine properly handles Thai grapheme clusters:

```js
// These are rendered as single units
'สวัสดี'   // ['ส', 'วั', 'ส', 'ดี']
'เก้า'     // ['เ', 'ก้า']
'การ'     // ['ก', 'า', 'ร']
```

### Anchor Positioning

Thai combining marks are positioned using anchor points:

- **TOP**: Tone marks, upper vowels (่ ้ ๊ ๋ ิ ี ึ ื)
- **BOTTOM**: Lower vowels (ุ ู ฺ)
- **LEFT**: Leading vowels (เ แ โ ใ ไ)
- **RIGHT**: Trailing vowels (า ะ อ)
- **CENTER**: Base consonants

## Architecture

### File Structure

```
handwritingEngine/
├── glyphData.js          # Glyph definitions and caching
├── renderingEngine.js    # Core rendering logic
├── HandwritingText.jsx   # React components
├── examples/
│   └── HandwritingDemo.jsx # Complete demo
└── README.md             # This file
```

### Core Classes

1. **GlyphCache** - Manages glyph storage and lookup
2. **CoordinateSystem** - Handles coordinate transformations
3. **GlyphLayout** - Positions glyphs and handles layout
4. **SVGPathGenerator** - Generates SVG paths and elements
5. **HandwritingEngine** - Main engine class

### Rendering Pipeline

1. **Text Segmentation** - Split text into grapheme clusters
2. **Glyph Lookup** - Find glyphs for each character
3. **Layout Calculation** - Position glyphs with spacing
4. **Variation Application** - Add natural randomness
5. **SVG Generation** - Create final SVG output

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

- React 16.8+ (for hooks)
- Modern JavaScript (ES2018+)

## Contributing

1. Add new glyphs to `glyphData.js`
2. Extend rendering engine in `renderingEngine.js`
3. Update React components in `HandwritingText.jsx`
4. Add examples in `examples/HandwritingDemo.jsx`

## License

MIT License - see LICENSE file for details.
