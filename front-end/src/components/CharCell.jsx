import C from "../styles/colors"

export default function CharCell({ ch, selected, onToggle }) {
  const sel = selected.has(ch)
  return (
    <button
      className="char-cell"
      onClick={() => onToggle(ch)}
      style={{
        width: "100%",
        aspectRatio: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        fontFamily: "inherit",
        borderRadius: 10,
        border: `1.5px solid ${sel ? C.ink : C.border}`,
        background: sel ? C.ink : C.bgCard,
        color: sel ? "#FBF9F5" : C.ink,
        cursor: "pointer",
      }}
    >
      {ch}
    </button>
  )
}
