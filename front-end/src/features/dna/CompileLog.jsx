// CompileLog.jsx — Build log panel extracted from DnaStep.jsx
import { useEffect, useRef } from 'react'
import C from '../../styles/colors'

export function CompileLog({ entries, maxLines = 120 }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [entries])

  const LOG_COLORS = {
    info:    C.inkMd,
    warn:    C.amber,
    error:   C.blush,
    success: C.sage,
  }

  const visible = entries.slice(-maxLines)

  return (
    <div style={{
      background: '#13110C', borderRadius: 10, padding: '12px 14px',
      fontFamily: 'monospace', fontSize: 10.5, lineHeight: 1.75,
      maxHeight: 220, overflowY: 'auto',
      border: '1px solid #2A2318',
    }}>
      {visible.length === 0 && (
        <span style={{ color: '#4A3F30' }}>— no log entries yet —</span>
      )}
      {visible.map((entry, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ color: '#3A3228', flexShrink: 0 }}>
            {new Date(entry.ts).toISOString().slice(11, 19)}
          </span>
          <span style={{ color: LOG_COLORS[entry.level] ?? C.inkMd, wordBreak: 'break-all' }}>
            {entry.msg}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
