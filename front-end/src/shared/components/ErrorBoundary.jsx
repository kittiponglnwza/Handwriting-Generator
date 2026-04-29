/**
 * ErrorBoundary.jsx — Global crash protection for Step components
 *
 * Wraps each Step to prevent white-screen crashes.
 * Phase 2 TODO: send error log to PostHog / Sentry
 */
import { Component } from "react"

export default class ErrorBoundary extends Component {
  state = { error: null, errorInfo: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Phase 2: send to PostHog/Sentry
    // trackEvent('js_error', { message: error.message, stack: info.componentStack })
    console.error("[ErrorBoundary]", error, info)
    this.setState({ errorInfo: info })
  }

  handleRetry = () => {
    this.setState({ error: null, errorInfo: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 48,
            textAlign: "center",
            minHeight: 320,
          }}
        >
          {/* Error icon */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#FEF3F2",
              border: "1.5px solid #FCA5A5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              marginBottom: 16,
            }}
          >
            ⚠️
          </div>

          <p style={{ fontSize: 16, fontWeight: 600, color: "#2C2416", marginBottom: 8 }}>
            An error occurred
          </p>

          <p style={{ fontSize: 13, color: "#888", marginBottom: 6, maxWidth: 360 }}>
            {this.state.error.message || "Unknown error"}
          </p>

          <p style={{ fontSize: 11, color: "#aaa", marginBottom: 24, maxWidth: 400 }}>
            Please try uploading PDF again or go back to the previous step
          </p>

          <button
            onClick={this.handleRetry}
            style={{
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 8,
              border: "1.5px solid #2C2416",
              background: "#2C2416",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            tryagain
          </button>

          {/* Dev detail — only in development */}
          {import.meta.env.DEV && this.state.errorInfo && (
            <details
              style={{
                marginTop: 24,
                textAlign: "left",
                fontSize: 10,
                color: "#aaa",
                maxWidth: 560,
                whiteSpace: "pre-wrap",
              }}
            >
              <summary style={{ cursor: "pointer", marginBottom: 8 }}>Dev: Component Stack</summary>
              {this.state.errorInfo.componentStack}
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}