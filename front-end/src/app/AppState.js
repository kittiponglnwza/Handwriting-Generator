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

// ============================================================
// AppState.js — Global application state (lightweight store)
// ============================================================
import { useState, useCallback } from "react";
import { AUTH_CONFIG } from "../config/auth.config";

/**
 * useAppState — top-level state hook for the entire app.
 * Manages auth mode, user session, and UI theme.
 */
export function useAppState() {
  const [authMode, setAuthMode] = useState(AUTH_CONFIG.MODES.LOGIN);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState("dark"); // "dark" | "light"

  const login = useCallback((userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthMode(AUTH_CONFIG.MODES.LOGIN);
  }, []);

  const toggleAuthMode = useCallback(() => {
    setAuthMode((prev) =>
      prev === AUTH_CONFIG.MODES.LOGIN
        ? AUTH_CONFIG.MODES.REGISTER
        : AUTH_CONFIG.MODES.LOGIN
    );
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return {
    // Auth state
    authMode,
    setAuthMode,
    toggleAuthMode,
    // User state
    currentUser,
    isAuthenticated,
    login,
    logout,
    // UI state
    theme,
    toggleTheme,
  };
}

export default useAppState;