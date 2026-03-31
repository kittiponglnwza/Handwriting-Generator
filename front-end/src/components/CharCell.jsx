import C from "../styles/colors"

// Thai combining chars (vowels/tone marks U+0E30–U+0E4E) cannot render standalone.
// Prefix with dotted circle ◌ (U+25CC) so the browser has a base glyph to attach to.
const THAI_COMBINING_RE = /^[\u0E30-\u0E4E]$/
function displayChar(ch) {
  if (!ch) return "·"
  if (THAI_COMBINING_RE.test(ch)) return "\u25CC" + ch
  return ch
}

export default function CharCell({ ch, selected, onToggle }) {
  const sel = selected.has(ch)
  return (
    <button
      className="char-cell"
      onClick={() => onToggle(ch)}
      title={`U+${ch.codePointAt(0)?.toString(16).toUpperCase().padStart(4,"0")}: ${ch}`}
      style={{
        width: "100%",
        aspectRatio: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        fontFamily: "'TH Sarabun New',Tahoma,sans-serif",
        borderRadius: 10,
        border: `1.5px solid ${sel ? C.ink : C.border}`,
        background: sel ? C.ink : C.bgCard,
        color: sel ? "#FBF9F5" : C.ink,
        cursor: "pointer",
      }}
    >
      {displayChar(ch)}
    </button>
  )
}