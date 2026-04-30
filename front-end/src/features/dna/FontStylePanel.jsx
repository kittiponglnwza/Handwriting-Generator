// FontStylePanel.jsx — Roughness / neatness / slant / boldness / randomness sliders
const FONT_SLIDERS = [
  { key: 'roughness',  label: 'Roughness',  min: 0,   max: 100, unit: ''  },
  { key: 'neatness',   label: 'Neatness',   min: 0,   max: 100, unit: ''  },
  { key: 'slant',      label: 'Slant',      min: -30, max: 30,  unit: '°' },
  { key: 'boldness',   label: 'Weight',     min: 70,  max: 150, unit: '%' },
  { key: 'randomness', label: 'Randomness', min: 0,   max: 100, unit: ''  },
]

export function FontStylePanel({ fontStyle, onFontStyleChange }) {
  if (!fontStyle || !onFontStyleChange) return null
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '20px 24px',
      border: '1px solid #DDD8CE', boxShadow: '0 1px 4px rgba(44,36,22,0.07)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#8A7B62', marginBottom: 18, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Font Style
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 32px' }}>
        {FONT_SLIDERS.map(({ key, label, min, max, unit }) => {
          const pct = ((fontStyle[key] - min) / (max - min)) * 100
          return (
            <div key={key} style={{ paddingBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: '#5C5040', fontWeight: 500 }}>{label}</label>
                <span style={{ fontSize: 12, color: '#1A1410', fontWeight: 700, background: '#F2EDE4', borderRadius: 5, padding: '1px 7px', minWidth: 36, textAlign: 'center' }}>
                  {fontStyle[key]}{unit}
                </span>
              </div>
              <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '100%', height: 3, background: '#E5DFD4', borderRadius: 3 }} />
                <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: `${pct}%`, height: 3, background: '#2C2416', borderRadius: 3, transition: 'width 0.05s' }} />
                <input
                  type="range" min={min} max={max} value={fontStyle[key]}
                  onChange={e => onFontStyleChange(key, Number(e.target.value))}
                  style={{ position: 'relative', width: '100%', margin: 0, appearance: 'none', WebkitAppearance: 'none', background: 'transparent', cursor: 'pointer', height: 20 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
