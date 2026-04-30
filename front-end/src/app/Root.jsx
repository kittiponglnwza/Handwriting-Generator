// ============================================================
// Root.jsx — Auth gate: แสดง AuthPage หรือ App ตาม login state
// ============================================================
import { useState, useCallback } from "react";
import { AuthPage } from "../features/auth/AuthPage";
import App from "./App";
import AUTH_CONFIG from "../config/auth.config";

const { MODES } = AUTH_CONFIG;

export default function Root() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState(MODES.LOGIN);

  const handleLogin = useCallback((userData) => {
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setAuthMode(MODES.LOGIN);
  }, []);

  const toggleAuthMode = useCallback(() => {
    setAuthMode((prev) =>
      prev === MODES.LOGIN ? MODES.REGISTER : MODES.LOGIN
    );
  }, []);

  if (isAuthenticated) {
    return <App onLogout={handleLogout} />;
  }

  return (
    <AuthPage
      authMode={authMode}
      toggleAuthMode={toggleAuthMode}
      onLoginSuccess={handleLogin}
    />
  );
}
