/**
 * analytics.js — PostHog event tracking wrapper (P2.3)
 *
 * Usage:
 *   import { trackEvent } from '../lib/analytics'
 *   trackEvent('step_entered', { step: 2 })
 *
 * Setup:
 *   1. npm install posthog-js
 *   2. Add VITE_POSTHOG_KEY=phc_xxx to .env
 *   3. Call initAnalytics() once in main.jsx
 */

const POSTHOG_KEY  = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST ?? 'https://app.posthog.com'

let _initialized = false

// ─── Init ─────────────────────────────────────────────────────────────────────

/**
 * Call once in main.jsx before <App /> mounts.
 * No-ops gracefully if VITE_POSTHOG_KEY is not set (local dev).
 */
export async function initAnalytics() {
  if (!POSTHOG_KEY) {
    if (import.meta.env.DEV) {
      console.info('[analytics] VITE_POSTHOG_KEY not set — tracking disabled')
    }
    return
  }

  try {
    const { default: posthog } = await import('posthog-js')
    posthog.init(POSTHOG_KEY, {
      api_host:             POSTHOG_HOST,
      capture_pageview:     false,   // manual control
      capture_pageleave:    true,
      autocapture:          false,   // Thai app — be explicit about events
      session_recording:    { maskAllInputs: true },
      persistence:          'localStorage',
    })
    window.posthog = posthog
    _initialized = true
  } catch (err) {
    console.warn('[analytics] PostHog init failed:', err.message)
  }
}

// ─── Core tracking ────────────────────────────────────────────────────────────

/**
 * Track a custom event.
 *
 * @param {string} name   - snake_case event name
 * @param {object} props  - optional properties
 */
export function trackEvent(name, props = {}) {
  if (!_initialized || !window.posthog) return
  try {
    window.posthog.capture(name, {
      ...props,
      _app: 'handwriting-generator',
      _version: '3.1',
    })
  } catch (err) {
    console.warn('[analytics] trackEvent failed:', err.message)
  }
}

/**
 * Identify the current user (call after Google login).
 *
 * @param {string} userId
 * @param {object} traits - e.g. { email, plan }
 */
export function identifyUser(userId, traits = {}) {
  if (!_initialized || !window.posthog) return
  try {
    window.posthog.identify(userId, traits)
  } catch {}
}

/**
 * Reset identity on logout.
 */
export function resetAnalytics() {
  if (!_initialized || !window.posthog) return
  try {
    window.posthog.reset()
  } catch {}
}

// ─── Convenience event helpers ────────────────────────────────────────────────
// Use these throughout the app for consistent naming:

/** Call when user enters any step */
export const trackStepEntered = (step) =>
  trackEvent('step_entered', { step })

/** Call after successful PDF parse */
export const trackPdfUploaded = ({ pages, sizeKb, charSource }) =>
  trackEvent('pdf_uploaded', { pages, size_kb: sizeKb, char_source: charSource })

/** Call after OCR / glyph extraction completes */
export const trackOcrCompleted = ({ glyphCount, durationMs }) =>
  trackEvent('ocr_completed', { glyph_count: glyphCount, duration_ms: durationMs })

/** Call after font compile succeeds */
export const trackFontBuilt = ({ glyphCount, durationMs }) =>
  trackEvent('font_built', { glyph_count: glyphCount, duration_ms: durationMs })

/** Call when any export succeeds */
export const trackExportSuccess = (format) =>
  trackEvent('export_success', { format })

/** Call when an export fails */
export const trackExportFailed = ({ format, error }) =>
  trackEvent('export_failed', { format, error })

/** Call when user opens payment/upgrade flow */
export const trackPaymentStarted = (plan) =>
  trackEvent('payment_started', { plan })

/** Call on successful payment webhook confirmation */
export const trackPaymentSuccess = ({ plan, amountThb }) =>
  trackEvent('payment_success', { plan, amount_thb: amountThb })

/** Call when JS error is caught by ErrorBoundary */
export const trackError = ({ message, step }) =>
  trackEvent('js_error', { message, step })
