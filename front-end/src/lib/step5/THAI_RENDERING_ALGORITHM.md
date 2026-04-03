# Thai Handwriting Rendering Engine - Anchor Positioning System

## Problem Overview

The original handwriting rendering engine treated each Unicode codepoint as an independent glyph with fixed slot widths, causing Thai text to render incorrectly:

- **Lower vowels (ุ ู ฺ)** were misplaced
- **Tone marks** floated separately  
- **Characters** did not form proper Thai syllables
- **Spacing** looked like isolated boxes instead of natural words

## Solution: Grapheme Cluster + Anchor Positioning

### 1. Thai Grapheme Cluster Segmentation

Thai script uses combining marks where multiple Unicode codepoints form a single visual character. We segment text into grapheme clusters:

```javascript
// Input: "สวัสดีครับ"
// Output: ["สวัส", "ดี", "คร", "ับ"]

function segmentGraphemes(str) {
  const codePoints = [...str].map(ch => ({ ch, cp: ch.codePointAt(0) }))
  const clusters = []
  let pendingLeading = null  // เ แ โ ใ ไ
  let current = null         // Current Thai cluster
  
  for (const { ch, cp } of codePoints) {
    if (isThaiLeadingVowel(cp)) {
      pendingLeading = ch
    } else if (isThaiConsonant(cp)) {
      current = (pendingLeading ?? "") + ch
      pendingLeading = null
    } else if (isThaiCombining(cp)) {
      if (current !== null) current += ch
      else if (pendingLeading !== null) pendingLeading += ch
    } else if (isThaiTrailingVowel(cp) && current !== null) {
      current += ch
    } else {
      clusters.push(ch)
    }
  }
  
  return clusters
}
```

### 2. Cluster Component Decomposition

Each grapheme cluster is decomposed into individual glyph lookup keys:

```javascript
// Cluster: "เก้า" 
// Components: ["เ", "ก", "้", "า"]

function clusterComponents(cluster) {
  const chars = [...cluster]
  const leading = chars.filter(ch => isThaiLeadingVowel(ch.codePointAt(0)))
  const consonant = chars.filter(ch => isThaiConsonant(ch.codePointAt(0)))
  const combining = chars.filter(ch => isThaiCombining(ch.codePointAt(0)))
  const trailing = chars.filter(ch => isThaiTrailingVowel(ch.codePointAt(0)))
  
  return [...leading, ...consonant, ...combining, ...trailing]
}
```

### 3. Anchor Positioning Algorithm

Each component is positioned at specific anchor points relative to the base consonant:

#### Anchor Types
- **TOP**: Tone marks, upper vowels (่ ้ ๊ ๋ ิ ี ึ ื)
- **BOTTOM**: Lower vowels (ุ ู ฺ)  
- **LEFT**: Leading vowels (เ แ โ ใ ไ)
- **RIGHT**: Trailing vowels (า ะ อ)
- **CENTER**: Base consonants

#### Position Calculation

```javascript
function calculateAnchorPositions(cluster, fontSize = 32) {
  const positions = []
  const baseScale = fontSize / 32
  
  // Find base consonant (center anchor)
  const baseConsonant = cluster.subGlyphs.find(sg => 
    isThaiConsonant(sg.ch.codePointAt(0))
  )
  
  for (const component of cluster.subGlyphs) {
    const cp = component.ch.codePointAt(0)
    const anchorType = getThaiAnchorType(cp)
    
    let offsetX = 0, offsetY = 0, scale = 1.0
    
    switch (anchorType) {
      case ThaiAnchorType.TOP:
        offsetY = -0.15 * fontSize    // Above consonant
        offsetX = 0.05 * fontSize     // Slight right adjustment
        scale = 0.8                   // Smaller than base
        break
        
      case ThaiAnchorType.BOTTOM:
        offsetY = 0.05 * fontSize     // Below consonant  
        offsetX = 0.02 * fontSize
        scale = 0.85
        break
        
      case ThaiAnchorType.LEFT:
        offsetX = -0.25 * fontSize    // Left of consonant
        offsetY = -0.02 * fontSize
        scale = 0.9
        break
        
      case ThaiAnchorType.RIGHT:
        offsetX = 0.2 * fontSize      // Right of consonant
        offsetY = -0.02 * fontSize
        scale = 0.9
        break
        
      case ThaiAnchorType.CENTER:
      default:
        // Base consonant: center position
        break
    }
    
    positions.push({
      component,
      anchorType,
      offsetX: offsetX * baseScale,
      offsetY: offsetY * baseScale,
      scale
    })
  }
  
  return positions
}
```

### 4. Layout Calculation

#### Cluster Width Calculation

```javascript
function calculateClusterWidth(cluster) {
  let width = 1.0 // Start with base consonant width
  
  for (const ch of [...cluster]) {
    const cp = ch.codePointAt(0)
    const anchorType = getThaiAnchorType(cp)
    
    // Only left/right anchors affect horizontal width
    if (anchorType === ThaiAnchorType.LEFT) {
      width += 0.3  // Leading vowel adds width to the left
    } else if (anchorType === ThaiAnchorType.RIGHT) {
      width += 0.4  // Trailing vowel adds width to the right  
    }
    // Top/bottom anchors don't affect horizontal width
  }
  
  return Math.min(width, 2.0) // Cap at 2x base width
}
```

#### Overall Layout Algorithm

```javascript
function calculateThaiLayout(text, fontSize) {
  const clusters = segmentGraphemes(text)
  let currentX = 0
  const layout = []
  
  for (const cluster of clusters) {
    const width = calculateClusterWidth(cluster) * fontSize
    const positions = calculateAnchorPositions(cluster, fontSize)
    
    // Position cluster at currentX
    layout.push({
      cluster,
      x: currentX,
      y: 0,
      width,
      positions
    })
    
    // Advance to next cluster position
    currentX += width + getSpacingAfter(cluster)
  }
  
  return layout
}

function getSpacingAfter(cluster) {
  // Add minimal spacing between clusters for natural word appearance
  return fontSize * 0.05
}
```

### 5. Rendering Implementation

#### React Component Rendering

```javascript
function AnchorGlyphSlot({ cluster, slotW, slotH, fontSize, ...props }) {
  const positions = calculateAnchorPositions(cluster, fontSize)
  
  return (
    <span style={{ 
      position: "relative",
      width: slotW, 
      height: slotH,
      display: "inline-block"
    }}>
      {positions.map((pos, idx) => (
        <span
          key={idx}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%", 
            transform: `translate(calc(-50% + ${pos.offsetX}px), calc(-50% + ${pos.offsetY}px))`,
            fontSize: fontSize * pos.scale
          }}
        >
          <GlyphComponent 
            glyph={pos.component.glyph}
            ch={pos.component.ch}
            fontSize={fontSize * pos.scale}
          />
        </span>
      ))}
    </span>
  )
}
```

#### HTML Export Rendering

```javascript
function renderThaiClusterHTML(cluster, fontSize, slotW, slotH) {
  const positions = calculateAnchorPositions(cluster, fontSize)
  
  const layers = positions.map(pos => `
    <span style="position:absolute;left:50%;top:50%;
                 transform:translate(calc(-50% + ${pos.offsetX}px), calc(-50% + ${pos.offsetY}px));
                 font-size:${fontSize * pos.scale}px">
      ${renderGlyphHTML(pos.component.glyph, pos.component.ch)}
    </span>
  `).join("")
  
  return `
    <span style="position:relative;width:${slotW}px;height:${slotH}px">
      ${layers}
    </span>
  `
}
```

## Algorithm Summary

### Thai Cluster Parsing Algorithm

```
1. Segment input text into grapheme clusters
   - Leading vowels: park until consonant arrives
   - Consonants: start new cluster, attach pending leading
   - Combining marks: attach to current cluster
   - Trailing vowels: attach to current cluster
   - Non-Thai: handle with Intl.Segmenter

2. For each cluster:
   a. Decompose into component Unicode codepoints
   b. Determine anchor type for each component
   c. Calculate relative positions and scales
   d. Compute cluster width based on left/right anchors

3. Layout:
   a. Position clusters sequentially with calculated widths
   b. Apply anchor positioning within each cluster
   c. Add minimal inter-cluster spacing
```

### Layout Calculation Algorithm

```
For each Thai grapheme cluster:
1. Base width = 1.0 (consonant width)
2. Add 0.3 for each leading vowel anchor
3. Add 0.4 for each trailing vowel anchor  
4. Cap maximum width at 2.0x base
5. Position components at calculated anchor offsets
6. Scale combining marks (0.8-0.9) for visual balance
```

### Positioning Offsets (relative to base consonant center)

```
TOP anchors (tone marks, upper vowels):
  offsetX: +0.05 * fontSize
  offsetY: -0.15 * fontSize  
  scale: 0.8

BOTTOM anchors (lower vowels):
  offsetX: +0.02 * fontSize
  offsetY: +0.05 * fontSize
  scale: 0.85

LEFT anchors (leading vowels):
  offsetX: -0.25 * fontSize
  offsetY: -0.02 * fontSize  
  scale: 0.9

RIGHT anchors (trailing vowels):
  offsetX: +0.20 * fontSize
  offsetY: -0.02 * fontSize
  scale: 0.9

CENTER anchors (consonants):
  offsetX: 0
  offsetY: 0
  scale: 1.0
```

## Benefits

1. **Natural Thai rendering**: Characters form proper syllables
2. **Correct positioning**: Vowels and tone marks attach at proper anchor points
3. **Proper spacing**: Clusters have appropriate widths, not fixed slots
4. **Maintains existing system**: Works with current SVG glyph system
5. **Performance efficient**: Minimal overhead over original rendering

## Testing

The system includes comprehensive tests in `thaiRenderingTest.js`:

- Grapheme cluster validation
- Anchor positioning verification  
- Performance benchmarks
- Real-world Thai text examples

This anchor positioning system transforms the handwriting engine from glyph-based rendering to proper Thai grapheme cluster rendering, creating natural-looking Thai handwriting that respects the script's complex combining mark system.
