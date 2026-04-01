# Coordinate Flow Analysis

## CSS Grid → PDF.js Coordinate Pipeline

### 1. CSS Grid Definition (Step1.jsx)
```css
@page { size: A4; margin: 14mm }
.grid { display: flex; flex-direction: column; gap: 7px }
.row { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 7px }
.cell { height: 28.5mm; }
```

### 2. Physical → Pixel Conversion
- A4: 210×297mm
- PDF.js scale=3: 1785×2526px
- Margin: 14mm = 119.1px
- Gap: 7px × 3 = 21px
- Cell height: 28.5mm = 339px

### 3. GRID_CONFIG Ratios (constants.js)
```javascript
export const GRID_CONFIG = {
  padXRatio:   0.0667,  // 119/1785
  topRatio:    0.1144,  // 289/2526 (header ~20mm)
  bottomRatio: 0.073,   // footer + margin
  gapRatio:    0.01176, // 21/1785
  insetRatio:  0.06,     // 6% inset for cropping
}
```

### 4. Coordinate Transformation Flow

```
CSS Grid (mm) → PDF.js Pixels (×3) → GRID_CONFIG Ratios → Calibration → Crop Rect
     ↓                ↓                    ↓              ↓           ↓
  28.5mm cell →   339px cell →   cellSize calculation → offsets → final crop
  7px gap   →   21px gap   →   gapRatio × pageWidth → gapAdjust → inset applied
  14mm margin → 119px margin → padXRatio × pageWidth → offsetX  → bounded by page
```

### 5. Critical Issues Identified

#### Issue A: Double Gap Application
```javascript
// In getGridGeometry():
const baseGap = Math.max(6, pageWidth * GRID_CONFIG.gapRatio)  // 21px
const gap = Math.max(2, baseGap + calibration.gapAdjust)       // + user adjust

// But CSS gap is already 21px at scale=3!
// This creates gap = 21px + adjustment, double-counting the base gap
```

#### Issue B: Cell Size Mismatch
```javascript
// CSS: height: 28.5mm = 339px (fixed)
// getGridGeometry(): dynamic calculation based on available width
const baseCellSize = (workWidth - baseGap * (GRID_COLS - 1)) / GRID_COLS
// This may not match the fixed 339px from CSS!
```

#### Issue C: Inset Ratio Impact
```javascript
// 6% inset on 339px = 20px inset each side
// Final crop = 339px - 40px = 299px
// This reduces capture area significantly
```

#### Issue D: Rounding Accumulation
```javascript
// Multiple Math.round() calls accumulate errors:
const cellX = Math.round(startX + col * (cellSize + gap)) + inset
const cellY = Math.round(startY + row * (cellSize + gap)) + inset
// Each round can lose 0.5px, accumulating across grid
```

### 6. Expected vs Actual Coordinates

For cell (0,0) with zero calibration:
```
CSS Expected:  x=119, y=289, w=339, h=339
GRID_CONFIG:  startX=119, startY=289, cellSize≈260, gap=21
Final Crop:   x=119+20=139, y=289+20=309, w=260-40=220, h=220
```

**Δ: x=+20px, y=+20px, w=-119px, h=-119px**

### 7. Root Cause of Overflow

The massive size reduction (339px → 220px) causes:
1. **False Overflows**: Large handwriting gets clipped by the reduced crop area
2. **Misalignment**: 20px offset shifts the crop away from actual content
3. **Scale Issues**: 220px vs expected 339px = 35% size reduction

### 8. DPI Considerations

- devicePixelRatio > 1 on retina displays
- Canvas may need scaling for proper rendering
- PDF.js scale=3 might not account for devicePixelRatio
- This could cause additional scaling mismatches

## Recommended Fixes

1. **Fix Gap Double-Counting**: Use calibration.gapAdjust as absolute gap, not additive
2. **Match CSS Cell Size**: Use fixed 339px height instead of dynamic calculation
3. **Reduce Inset Ratio**: 6% is too aggressive, try 2-3%
4. **Accumulate Coordinates**: Avoid per-cell rounding, use cumulative positions
5. **Add DPI Handling**: Account for devicePixelRatio in canvas operations
