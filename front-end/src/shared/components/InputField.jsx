// ============================================================
// InputField.jsx — Reusable futuristic input component
// ============================================================
import React, { useState } from "react";

/**
 * InputField
 * @param {string}   label        - visible label text
 * @param {string}   name         - field name (matches form state key)
 * @param {string}   type         - input type (text | email | password | checkbox)
 * @param {string}   value        - controlled value
 * @param {function} onChange     - change handler
 * @param {string}   error        - validation error message
 * @param {string}   placeholder  - placeholder text
 * @param {node}     icon         - leading icon JSX
 * @param {boolean}  required     - marks field required
 * @param {boolean}  disabled     - disables input
 */
export function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  icon,
  required = false,
  disabled = false,
  className = "",
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const isPassword = type === "password";
  const isCheckbox = type === "checkbox";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  // ── Checkbox variant ──────────────────────────────────────
  if (isCheckbox) {
    return (
      <label className={`checkbox-field ${className}`}>
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            name={name}
            checked={value}
            onChange={onChange}
            disabled={disabled}
            className="checkbox-input"
          />
          <span className="checkbox-custom">
            {value && (
              <svg viewBox="0 0 12 10" fill="none" className="check-icon">
                <path
                  d="M1 5L4.5 8.5L11 1.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span className="checkbox-label">{label}</span>
        </div>
        {error && <span className="field-error">{error}</span>}
      </label>
    );
  }

  // ── Text / Email / Password variant ───────────────────────
  return (
    <div className={`input-field ${error ? "has-error" : ""} ${focused ? "is-focused" : ""} ${className}`}>
      {label && (
        <label htmlFor={name} className="field-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {icon && <span className="input-icon leading">{icon}</span>}
        <input
          id={name}
          name={name}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="input-control"
          autoComplete={isPassword ? "current-password" : "off"}
        />
        {isPassword && (
          <button
            type="button"
            className="input-icon trailing toggle-password"
            onClick={() => setShowPassword((p) => !p)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && (
        <span className="field-error" role="alert">
          <ErrorIcon />
          {error}
        </span>
      )}
    </div>
  );
}

// ── Inline SVG icons ──────────────────────────────────────
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="error-icon-svg">
    <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4.5zm0 7a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
  </svg>
);

export default InputField;