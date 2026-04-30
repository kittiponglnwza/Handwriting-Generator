// ============================================================
// useAuthForm.js — Custom hook for Login / Register forms
// ============================================================
import { useState, useCallback } from "react";
import AUTH_CONFIG from "../../config/auth.config";

const { MODES, validation } = AUTH_CONFIG;

// ── Initial state ───────────────────────────────────────────
const loginInitial = {
  email: "",
  password: "",
  rememberMe: false,
};

const registerInitial = {
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreeTerms: false,
};

// ── Validators ──────────────────────────────────────────────
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? null : "Please enter a valid email address.";
};

const validateLogin = (values) => {
  const errors = {};
  if (!values.email.trim()) errors.email = "Email is required.";
  else {
    const emailErr = validateEmail(values.email);
    if (emailErr) errors.email = emailErr;
  }
  if (!values.password) errors.password = "Password is required.";
  return errors;
};

const validateRegister = (values) => {
  const errors = {};
  if (!values.firstname.trim()) errors.firstname = "Required.";
  if (!values.lastname.trim()) errors.lastname = "Required.";
  if (!values.email.trim()) errors.email = "Email is required.";
  else {
    const emailErr = validateEmail(values.email);
    if (emailErr) errors.email = emailErr;
  }
  if (!values.password)
    errors.password = "Password is required.";
  else if (values.password.length < validation.passwordMinLength)
    errors.password = `At least ${validation.passwordMinLength} characters required.`;
  if (!values.confirmPassword)
    errors.confirmPassword = "Please confirm your password.";
  else if (values.confirmPassword !== values.password)
    errors.confirmPassword = "Passwords do not match.";
  if (!values.agreeTerms)
    errors.agreeTerms = "You must agree to the terms.";
  return errors;
};

// ── Main hook ───────────────────────────────────────────────
export function useAuthForm(mode, toggleMode, onLoginSuccess) {
  const isLogin = mode === MODES.LOGIN;

  const [loginValues, setLoginValues] = useState(loginInitial);
  const [registerValues, setRegisterValues] = useState(registerInitial);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const values = isLogin ? loginValues : registerValues;
  const setValues = isLogin ? setLoginValues : setRegisterValues;

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      const newVal = type === "checkbox" ? checked : value;
      setValues((prev) => ({ ...prev, [name]: newVal }));
      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    },
    [errors, setValues]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const validate = isLogin ? validateLogin : validateRegister;
      const validationErrors = validate(values);

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsSubmitting(true);
      setErrors({});

      // Mock API delay — replace with real API call
      await new Promise((r) => setTimeout(r, 900));

      setIsSubmitting(false);
      setSubmitSuccess(true);

      // Build mock user object from form values
      const userData = isLogin
        ? { email: values.email }
        : {
            email: values.email,
            name: `${values.firstname} ${values.lastname}`.trim(),
          };

      // Brief success flash, then navigate into the app
      setTimeout(() => {
        if (typeof onLoginSuccess === "function") {
          onLoginSuccess(userData);
        }
      }, 600);
    },
    [isLogin, values, onLoginSuccess]
  );

  const handleToggleMode = useCallback(() => {
    setErrors({});
    setSubmitSuccess(false);
    toggleMode();
  }, [toggleMode]);

  const handleSocialLogin = useCallback(
    (provider) => {
      // Mock social login — เข้าแอปได้เลย
      const userData = { email: `user@${provider}.com`, provider };
      if (typeof onLoginSuccess === "function") {
        onLoginSuccess(userData);
      }
    },
    [onLoginSuccess]
  );

  return {
    values,
    errors,
    isSubmitting,
    submitSuccess,
    handleChange,
    handleSubmit,
    handleToggleMode,
    handleSocialLogin,
  };
}

export default useAuthForm;