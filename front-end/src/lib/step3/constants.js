export const GRID_COLS = 6

export const TEMPLATE_CODE_RE = /^HG(\d{1,4})$/i
export const HGMETA_RE =
  /HGMETA:page=(\d+),totalPages=(\d+),from=(\d+),to=(\d+),count=(\d+),total=(\d+)(?:,j=([A-Za-z0-9_-]+))?/
// Optional ,j=… = base64url(JSON array of one string per cell on this page)
export const HGQR_RE =
  /^HG:p=(\d+)\/(\d+),c=(\d+)-(\d+),n=(\d+),t=(\d+)(?:,j=([A-Za-z0-9_-]+))?$/

export const TEMPLATE_INDEX_RE = /^(\d{1,4})$/
export const MIN_TRUSTED_INDEX_TARGETS = 6

// Per-cell character identity tag — written as a tiny hidden element per cell in Step 1.
// Short strings are never split by pdfjs text extraction, unlike long base64 payloads.
// Format: HGCHAR:N=<char>  where N is the 1-based cell index.
export const HGCHAR_RE = /^HGCHAR:(\d+)=(.*)$/

// STEP 1 — SINGLE SOURCE OF TRUTH FOR GRID GEOMETRY
// Exact values from Step1 CSS template
export const GRID_GEOMETRY = {
  // A4 page at PDF.js scale=3
  pageWidthPx: 1785,     // 210mm × 3
  pageHeightPx: 2526,    // 297mm × 3
  
  // CSS Grid exact values
  marginPx: 119,          // 14mm × 3
  headerPx: 169,          // ~20mm × 3
  cellWidthPx: 260,      // Dynamic from available width
  cellHeightPx: 339,     // 28.5mm × 3 (FIXED from CSS)
  gapPx: 21,             // 7px × 3
  
  // Calculated positions
  startX: 119,           // marginPx
  startY: 289,           // marginPx + headerPx
  
  // Fixed inset ratio (2% instead of 6%)
  insetRatio: 0.02,
}

// GRID_CONFIG — legacy, kept for compatibility
export const GRID_CONFIG = {
  padXRatio:   0.0667,
  topRatio:    0.1144,
  bottomRatio: 0.073,
  gapRatio:    0.01176,
  insetRatio:  0.02,  // FIXED: reduced from 0.06 to 0.02
}

// Zero offset — GRID_CONFIG is now accurately matched to Step1 CSS layout.
// autoCalibration handles per-page fine-tuning on top of this.
export const DEFAULT_CALIBRATION = {
  offsetX: 0,
  offsetY: 0,
  cellAdjust: 0,
  gapAdjust: 0,
}

export const TEMPLATE_CALIBRATION = {
  offsetX: 0,
  offsetY: 0,
  cellAdjust: 0,
  gapAdjust: 0,
}

// ZERO_CALIBRATION — initial user-delta in Step 3 (starts at zero, not DEFAULT).
export const ZERO_CALIBRATION = {
  offsetX: 0,
  offsetY: 0,
  cellAdjust: 0,
  gapAdjust: 0,
}