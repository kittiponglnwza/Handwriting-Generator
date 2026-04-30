// ============================================================
// auth.config.js — Central configuration for Auth feature
// ============================================================

export const AUTH_CONFIG = {
  // App branding
  appName: "NEXUS",
  appTagline: "Enter the future.",

  // Form modes
  MODES: {
    LOGIN: "login",
    REGISTER: "register",
  },

  // Validation rules
  validation: {
    passwordMinLength: 8,
    fullnameMinLength: 2,
  },

  // Social login providers
  socialProviders: [
    {
      id: "google",
      label: "Google",
      icon: "google",
    },
    {
      id: "github",
      label: "GitHub",
      icon: "github",
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: "facebook",
    },
  ],

  // Navigation links (top navbar)
  navLinks: ["Home", "About", "Blog", "Pages", "Contact"],

  // Text content per mode
  content: {
    login: {
      heading: "Hello!",
      subheading: "Welcome Back",
      submitLabel: "Sign In",
      switchPrompt: "Don't have an account?",
      switchAction: "Create Account",
      dividerText: "Or continue with",
    },
    register: {
      heading: "Join Us",
      subheading: "Create Account",
      submitLabel: "Get Started",
      switchPrompt: "Already have an account?",
      switchAction: "Sign In",
      dividerText: "Or sign up with",
    },
  },
};

export default AUTH_CONFIG;