// PaperPicker.jsx — Paper style selector (blank / ruled / grid / aged / dark / kraft)
export const PAPERS = [
  { id: 'blank', label: 'Blank',      bg: '#FDFAF5', texture: false },
  { id: 'ruled', label: 'Ruled',      bg: '#FDFAF5', texture: 'ruled' },
  { id: 'grid',  label: 'Grid',       bg: '#FDFAF5', texture: 'grid' },
  { id: 'aged',  label: 'Aged',       bg: '#F2EBD9', texture: false },
  { id: 'dark',  label: 'Blackboard', bg: '#1A1F2E', texture: false },
  { id: 'kraft', label: 'Kraft',      bg: '#D4B896', texture: false },
]

export function PaperPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {PAPERS.map(p => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            border: value === p.id ? '2px solid #333' : '1px solid #ccc',
            background: p.bg,
            color: p.id === 'dark' ? '#fff' : '#333',
            fontWeight: value === p.id ? 600 : 400,
            transition: 'all 0.12s',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
