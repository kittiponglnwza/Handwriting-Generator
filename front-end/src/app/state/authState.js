// ── Auth state hook ───────────────────────────────────────────────────────────
// Manages auth mode, user session, and UI theme.
// Separated from appState.js (pipeline data) to follow single-responsibility.

import { useState, useCallback } from 'react'
import { AUTH_CONFIG } from '../../config/auth.config'

export function useAuthState() {
  const [authMode, setAuthMode] = useState(AUTH_CONFIG.MODES.LOGIN)
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [theme, setTheme] = useState('dark') // 'dark' | 'light'

  const login = useCallback((userData) => {
    setCurrentUser(userData)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    setAuthMode(AUTH_CONFIG.MODES.LOGIN)
  }, [])

  const toggleAuthMode = useCallback(() => {
    setAuthMode((prev) =>
      prev === AUTH_CONFIG.MODES.LOGIN
        ? AUTH_CONFIG.MODES.REGISTER
        : AUTH_CONFIG.MODES.LOGIN
    )
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return {
    authMode, setAuthMode, toggleAuthMode,
    currentUser, isAuthenticated, login, logout,
    theme, toggleTheme,
  }
}

export default useAuthState
