/**
 * useVerifyGlyphsState.js
 *
 * Persists all UI state for the "Verify Glyphs" step across step switches.
 * Saves to localStorage so state survives page refreshes too.
 *
 * Persisted state:
 *  - selectedGlyphId  : string | null
 *  - zoom             : number (0.5 – 3.0)
 *  - filter           : 'all' | 'ok' | 'poor' | 'missing'
 *  - search           : string
 *  - compareMode      : boolean
 *  - edits            : Record<glyphId, { path?: string, note?: string }>
 *  - scrollTop        : number (restored to sidebar scroll container)
 */

import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'hw_verify_glyphs_v1'
const DEBOUNCE_MS  = 300

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full or private mode — silently ignore
  }
}

// ── Initial state ─────────────────────────────────────────────────────────────

const DEFAULT_STATE = {
  selectedGlyphId: null,
  zoom:            1,
  filter:          'all',
  search:          '',
  compareMode:     false,
  edits:           {},
  scrollTop:       0,
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVerifyGlyphsState() {
  const [state, _setState] = useState(() => {
    const saved = loadFromStorage()
    return saved ? { ...DEFAULT_STATE, ...saved } : DEFAULT_STATE
  })

  // Debounced localStorage write — avoids thrashing on rapid changes (zoom slider, search typing)
  const saveTimer = useRef(null)
  const pendingState = useRef(state)

  const persist = useCallback((nextState) => {
    pendingState.current = nextState
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveToStorage(pendingState.current)
    }, DEBOUNCE_MS)
  }, [])

  // Unified setter — merges partial state and schedules persistence
  const setState = useCallback((patch) => {
    _setState(prev => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      persist(next)
      return next
    })
  }, [persist])

  // Flush immediately on unmount so we don't lose the last keystrokes
  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current)
      saveToStorage(pendingState.current)
    }
  }, [])

  // Individual setters for ergonomics
  const setSelectedGlyphId = useCallback((id) => setState({ selectedGlyphId: id }), [setState])
  const setZoom            = useCallback((z) => setState({ zoom: z }), [setState])
  const setFilter          = useCallback((f) => setState({ filter: f }), [setState])
  const setSearch          = useCallback((s) => setState({ search: s }), [setState])
  const setCompareMode     = useCallback((v) => setState({ compareMode: v }), [setState])
  const setScrollTop       = useCallback((v) => setState({ scrollTop: v }), [setState])

  const setEdit = useCallback((glyphId, patch) => {
    setState(prev => ({
      edits: {
        ...prev.edits,
        [glyphId]: { ...(prev.edits[glyphId] ?? {}), ...patch },
      },
    }))
  }, [setState])

  const clearEdit = useCallback((glyphId) => {
    setState(prev => {
      const next = { ...prev.edits }
      delete next[glyphId]
      return { edits: next }
    })
  }, [setState])

  const reset = useCallback(() => {
    _setState(DEFAULT_STATE)
    saveToStorage(DEFAULT_STATE)
  }, [])

  return {
    ...state,
    setSelectedGlyphId,
    setZoom,
    setFilter,
    setSearch,
    setCompareMode,
    setScrollTop,
    setEdit,
    clearEdit,
    reset,
  }
}