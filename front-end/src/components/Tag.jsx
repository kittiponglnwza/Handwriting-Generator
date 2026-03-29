import C from "../styles/colors"

const toneStyles = {
  neutral: { background: C.bgMuted, color: C.inkMd, border: C.border },
  sage: { background: C.sageLt, color: C.sage, border: C.sageMd },
  blush: { background: C.blushLt, color: C.blush, border: C.blushMd },
  amber: { background: C.amberLt, color: C.amber, border: C.amberMd },
  draft: { background: C.amberLt, color: C.amber, border: C.amberMd },
}

export default function Tag({ children, color = "neutral" }) {
  const s = toneStyles[color]
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.04em",
        background: s.background,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {children}
    </span>
  )
}
