// ── Backward-compatibility shim ───────────────────────────────────────────────
// AppState.js has been split into:
//   app/state/appState.js  — INITIAL_STATE + canOpenStep
//   app/state/authState.js — useAuthState hook
// This file re-exports both so existing imports keep working during migration.

export { INITIAL_STATE, canOpenStep } from './state/appState'
export { useAuthState, default } from './state/authState'
  