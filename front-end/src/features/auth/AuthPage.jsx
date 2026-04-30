// ============================================================
// AuthPage.jsx — Auth form, รองรับทั้ง full-page และ modal
// ============================================================
import React, { useEffect } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { useAuthForm } from "./useAuthForm";
import AUTH_CONFIG from "../../config/auth.config";
import "../../styles/AuthPage.css";

const { MODES } = AUTH_CONFIG;

export function AuthPage({
  authMode,
  toggleAuthMode,
  onLoginSuccess,
  onClose,
  isModal = false,
}) {
  const isLogin = authMode === MODES.LOGIN;

  const {
    values,
    errors,
    isSubmitting,
    submitSuccess,
    handleChange,
    handleSubmit,
    handleToggleMode,
    handleSocialLogin,
  } = useAuthForm(authMode, toggleAuthMode, onLoginSuccess);

  // Close on Escape key
  useEffect(() => {
    if (!isModal) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModal, onClose]);

  const sharedFormProps = {
    values,
    errors,
    isSubmitting,
    submitSuccess,
    onChange: handleChange,
    onSubmit: handleSubmit,
    onToggleMode: handleToggleMode,
    onSocialLogin: handleSocialLogin,
  };

  const card = (
    <div className={`auth-card${isModal ? " auth-card--modal" : ""}`}>
      {/* Close button — modal only */}
      {isModal && (
        <button className="auth-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      <div className="auth-brand">{AUTH_CONFIG.appName}</div>

      <div key={authMode} className="form-animate-wrapper">
        {isLogin ? (
          <LoginForm {...sharedFormProps} />
        ) : (
          <RegisterForm {...sharedFormProps} />
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="auth-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
        <div className="auth-modal-wrap">
          {card}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <main className="auth-main">{card}</main>
    </div>
  );
}

export default AuthPage;