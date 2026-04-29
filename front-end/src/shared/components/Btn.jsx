import C from "../../styles/colors"

export default function Btn({
  children,
  onClick,
  disabled,
  variant = "ghost",
  size = "md",
}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    border: "none",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s ease",
    fontWeight: 400,
  }

  const sizes = {
    sm: { fontSize: 12, padding: "5px 14px", borderRadius: 8 },
    md: { fontSize: 13, padding: "8px 18px", borderRadius: 10 },
  }

  const variants = {
    primary: { background: C.ink, color: "#FBF9F5", border: "none" },
    ghost: {
      background: "transparent",
      color: C.inkMd,
      border: `1px solid ${C.border}`,
    },
    sage: { background: C.sage, color: "#fff", border: "none" },
  }

  return (
    <button
      onClick={!disabled ? onClick : undefined}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
    >
      {children}
    </button>
  )
}
