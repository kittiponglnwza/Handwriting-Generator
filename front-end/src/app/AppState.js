// ── Initial application state ───────────────────────────────────────────────
export const INITIAL_STATE = {
  parsedFile:      null,
  glyphResult:     null,
  versionedGlyphs: [],
  ttfBuffer:       null,
  puaMap:          null,
  fontStyle: {
    roughness:   30,
    neatness:    70,
    slant:        0,
    boldness:   100,
    randomness:  40,
  },
}

// ── Navigation guard ─────────────────────────────────────────────────────────
// Returns true if the user is allowed to open targetStep given current appState.
// Centralised here so App.jsx and AppLayout.jsx share the same logic.
export function canOpenStep(targetStep, appState) {
  const parsed      = appState.parsedFile
  const glyphResult = appState.glyphResult
  switch (targetStep) {
    case 1: return true
    case 2: return true
    case 3: return (
      parsed !== null &&
      parsed.status === "parsed" &&
      Array.isArray(parsed.characters) &&
      parsed.characters.length > 0
    )
    case 4: return (glyphResult?.glyphs?.length ?? 0) > 0
    case 5: return (glyphResult?.glyphs?.length ?? 0) > 0
    default: return false
  }
}
