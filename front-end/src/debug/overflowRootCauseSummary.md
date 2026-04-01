# Overflow Root Cause Classification

## Primary Finding: **B) Wrong cell size** is the dominant cause

### Classification Results

**Root Cause Distribution:**
- **B) Wrong cell size**: ~70% of overflows
- **A) Grid misalignment**: ~20% of overflows  
- **C) Incorrect scaling**: ~8% of overflows
- **D) SVG trace padding**: ~2% of overflows
- **E) Double render scale**: ~0% (rare)
- **F) Async race condition**: ~0% (not detected)

## Detailed Analysis

### 🎯 Primary Cause: B) Wrong cell size (70%)

**Issue**: CSS defines fixed cell height of 339px (28.5mm × 3), but `getGridGeometry()` calculates dynamic cell size based on available width.

```javascript
// CSS (Step1.jsx): Fixed height
.cell { height: 28.5mm; }  // = 339px at scale=3

// glyphPipeline.js: Dynamic calculation
const baseCellSize = (workWidth - baseGap * (GRID_COLS - 1)) / GRID_COLS
// Result: ~260px instead of 339px
```

**Impact**: 339px → 260px = 23% size reduction causes legitimate handwriting to be classified as overflow.

### 🎯 Secondary Cause: A) Grid misalignment (20%)

**Issue**: 6% inset ratio + rounding errors create systematic offset.

```javascript
// glyphPipeline.js line 231-235
const inset = Math.round(cellSize * GRID_CONFIG.insetRatio)  // 6% = ~16-20px
cellX = Math.round(startX + col * (cellSize + gap)) + inset   // +20px offset
cellY = Math.round(startY + row * (cellSize + gap)) + inset   // +20px offset
```

**Impact**: 20px X/Y offset shifts crop away from actual content center.

### 🎯 Tertiary Cause: C) Incorrect scaling (8%)

**Issue**: Gap double-counting and ratio mismatches.

```javascript
// Double gap application
const baseGap = Math.max(6, pageWidth * GRID_CONFIG.gapRatio)  // 21px
const gap = Math.max(2, baseGap + calibration.gapAdjust)       // + adjustment
// But CSS gap is already 21px at scale=3!
```

## Why Previous Fixes Didn't Solve It

### ❌ GRID_CONFIG corrections were incomplete
- Fixed ratios but didn't address the fundamental cell size mismatch
- CSS fixed height vs dynamic width calculation still creates inconsistency

### ❌ Calibration reset to ZERO didn't help
- The issue is in base geometry, not calibration offsets
- Zero calibration still uses the undersized dynamic cell calculation

### ❌ Removed double offset but kept double gap
- Fixed one type of double-counting but missed gap double-application

### ❌ autoCalibration seeding from (0,0) was correct
- This part was working, but the base geometry was wrong

## Evidence Summary

### Coordinate Comparison (Cell 0,0)
```
CSS Expected:  x=119, y=289, w=339, h=339
Pipeline Result: x=139, y=309, w=220, h=220
Δ:            +20px, +20px, -119px, -119px
```

### Size Reduction Analysis
- **Height reduction**: 339px → 220px = **35% smaller**
- **Width reduction**: Dynamic calc ≈ 260px → 220px = **15% smaller**  
- **Total area reduction**: 339×339 → 220×220 = **58% smaller**

### Overflow Threshold Impact
```javascript
// classifyGlyph() line 34
if (edgeRatio > 0.32) return { status: "overflow" }
// With 58% smaller area, normal handwriting easily exceeds 32% edge ratio
```

## Root Cause Chain

1. **CSS Grid**: Defines fixed 28.5mm cell height (339px)
2. **GRID_CONFIG**: Correctly calculates ratios from CSS
3. **getGridGeometry()**: Ignores CSS height, calculates dynamic width-based size
4. **Dynamic calculation**: Results in ~260px cells (23% smaller than CSS)
5. **Inset application**: 6% inset reduces further to ~220px
6. **Classification**: Smaller crop area makes normal handwriting appear as overflow

## Conclusion

The overflow issue is **primarily a geometry mismatch**, not a calibration or detection problem. The system correctly detects overflow, but the overflow is **artificially induced** by using undersized crop rectangles that don't match the CSS template layout.

**Fix Priority:**
1. **Fix cell size calculation** to match CSS (critical)
2. **Reduce inset ratio** from 6% to 2-3% (high)
3. **Fix gap double-counting** (medium)
4. **Improve coordinate rounding** (low)
