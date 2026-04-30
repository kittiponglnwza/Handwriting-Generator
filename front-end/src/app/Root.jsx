// ============================================================
// Root.jsx — App โหลดก่อน, login เป็น modal overlay
// ============================================================
import { useState, useCallback } from "react";
import App from "./App";
import { AuthPage } from "../features/auth/AuthPage";
import AUTH_CONFIG from "../config/auth.config";

const { MODES } = AUTH_CONFIG;

export default function Root() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState(MODES.LOGIN);

  const openLogin = useCallback(() => {
    setAuthMode(MODES.LOGIN);
    setShowAuth(true);
  }, []);

  const openRegister = useCallback(() => {
    setAuthMode(MODES.REGISTER);
    setShowAuth(true);
  }, []);

  const closeAuth = useCallback(() => {
    setShowAuth(false);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
    setShowAuth(false);
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const toggleAuthMode = useCallback(() => {
    setAuthMode((prev) =>
      prev === MODES.LOGIN ? MODES.REGISTER : MODES.LOGIN
    );
  }, []);

  return (
    <>
      <App
        isAuthenticated={isAuthenticated}
        onOpenLogin={openLogin}
        onOpenRegister={openRegister}
        onLogout={handleLogout}
      />

      {showAuth && (
        <AuthPage
          authMode={authMode}
          toggleAuthMode={toggleAuthMode}
          onLoginSuccess={handleLoginSuccess}
          onClose={closeAuth}
          isModal
        />
      )}
    </>
  );
}