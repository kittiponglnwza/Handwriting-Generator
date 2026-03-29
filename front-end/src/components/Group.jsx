import C from "../styles/colors"
import CharCell from "./CharCell"

export default function Group({ label, chars, selected, onToggle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: C.inkLt,
          marginBottom: 10,
        }}
      >
        {label}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(38px, 1fr))",
          gap: 6,
        }}
      >
        {chars.map(ch => (
          <CharCell key={ch} ch={ch} selected={selected} onToggle={onToggle} />
        ))}
      </div>
    </div>
  )
}
