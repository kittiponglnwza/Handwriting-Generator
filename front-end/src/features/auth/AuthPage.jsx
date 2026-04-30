// ============================================================
// AuthPage.jsx — Minimal Auth Layout
// ============================================================
import React from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { useAuthForm } from "./useAuthForm";
import AUTH_CONFIG from "../../config/auth.config";
import "../../styles/AuthPage.css";

const { MODES } = AUTH_CONFIG;

export function AuthPage({ authMode, toggleAuthMode, onLoginSuccess }) {
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

  return (
    <div className="auth-page">
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-brand">{AUTH_CONFIG.appName}</div>

          <div key={authMode} className="form-animate-wrapper">
            {isLogin ? (
              <LoginForm {...sharedFormProps} />
            ) : (
              <RegisterForm {...sharedFormProps} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AuthPage;