/**
 * ThaiAuditPanel.jsx — Thai Rendering Audit UI
 *
 * วิธีใช้: เพิ่มเข้าไปใน QADashboard.jsx หรือ Step3.jsx
 *
 *   import ThaiAuditPanel from '../components/ThaiAuditPanel'
 *   <ThaiAuditPanel renderFn={(text) => myEngine.renderToSVG(text)} />
 *
 * ถ้ายังไม่มี renderFn จริง ให้ไม่ส่ง prop — จะใช้ mock SVG แทน
 */

import { useState, useCallback } from 'react'
import { auditThaiRendering, printAuditSummary } from '../tests/thaiRenderingAudit'
import C from '../styles/colors'

// ─── Default mock render (ใช้เมื่อไม่ส่ง renderFn prop) ──────────────────────
const DEFAULT_MOCK_RENDER = (text) => {
  // SVG จำลอง — tone marks อยู่ y ต่ำกว่า baseline เล็กน้อย (pass)
  const lines = text.split('\n')
  const textEls = lines.map((line, i) =>
    `<text x="10" y="${50 + i * 20}">${line}</text>`
  ).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg"><g>${textEls}</g></svg>`
}

// ─── Badge component ──────────────────────────────────────────────────────────
function Badge({ ok, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 600,
      background: ok ? C.sageLt : C.blushLt,
      color: ok ? C.sage : C.blush,
      border: `1px solid ${ok ? C.sageMd : C.blushMd}`,
    }}>
      {ok ? '✓' : '✗'} {label}
    </span>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function MiniBar({ value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div style={{ height: 4, background: C.bgMuted, borderRadius: 2, overflow: 'hidden', flex: 1 }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: color, borderRadius: 2,
        transition: 'width 0.5s cubic-bezier(.4,0,.2,1)',
      }} />
    </div>
  )
}

// ─── Issue icons ──────────────────────────────────────────────────────────────
const ISSUE_META = {
  hasFloatingMark:     { label: 'Tone Mark', short: 'TM', color: C.blush },
  hasWrongSpacing:     { label: 'Spacing',   short: 'SP', color: C.amber },
  hasBrokenLineHeight: { label: 'Line-H',    short: 'LH', color: C.amber },
  renderError:         { label: 'Error',     short: 'ER', color: C.blush },
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ThaiAuditPanel({ renderFn }) {
  const [results,   setResults]   = useState(null)
  const [running,   setRunning]   = useState(false)
  const [expanded,  setExpanded]  = useState(null)   // index of expanded row
  const [filter,    setFilter]    = useState('all')  // 'all' | 'pass' | 'fail'

  const fn = renderFn ?? DEFAULT_MOCK_RENDER
  const usingMock = !renderFn

  const runAudit = useCallback(async () => {
    setRunning(true)
    setResults(null)
    setExpanded(null)

    // ให้ UI render ก่อนค่อย run (ป้องกัน freeze)
    await new Promise(r => setTimeout(r, 30))

    try {
      const res = auditThaiRendering(fn)
      setResults(res)
      printAuditSummary(res)
    } finally {
      setRunning(false)
    }
  }, [fn])

  // ── Summary counts ────────────────────────────────────────────────────────
  const summary = results ? {
    total:  results.length,
    passed: results.filter(r => r.pass).length,
    failed: results.filter(r => !r.pass).length,
    tm:     results.filter(r => r.hasFloatingMark).length,
    sp:     results.filter(r => r.hasWrongSpacing).length,
    lh:     results.filter(r => r.hasBrokenLineHeight).length,
    err:    results.filter(r => r.renderError).length,
  } : null

  const visible = results
    ? results.filter(r =>
        filter === 'all'  ? true :
        filter === 'pass' ? r.pass :
        !r.pass
      )
    : []

  // ── Styles ─────────────────────────────────────────────────────────────────
  const card = {
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    overflow: 'hidden',
  }

  return (
    <div style={card}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 18px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 16 }}>🇹🇭</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.ink }}>
            Thai Rendering Audit
          </p>
          {usingMock && (
            <p style={{ margin: 0, fontSize: 10, color: C.amber, marginTop: 1 }}>
              ⚠ ใช้ mock render — ส่ง renderFn prop เพื่อทดสอบ engine จริง
            </p>
          )}
        </div>

        <button
          onClick={runAudit}
          disabled={running}
          style={{
            padding: '7px 16px', borderRadius: 8,
            border: 'none', cursor: running ? 'not-allowed' : 'pointer',
            background: running ? C.bgMuted : C.ink,
            color: running ? C.inkLt : '#fff',
            fontSize: 12, fontWeight: 500,
            transition: 'all 0.15s ease',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {running ? (
            <><span style={{ display: 'inline-block', animation: 'spin .7s linear infinite', fontSize: 12 }}>⟳</span> กำลังรัน…</>
          ) : (
            <>{results ? '↺ รันใหม่' : '▶ รัน Audit'}</>
          )}
        </button>
      </div>

      {/* ── Summary bar (shown after run) ── */}
      {summary && (
        <div style={{
          padding: '12px 18px',
          background: summary.failed === 0 ? C.sageLt : C.amberLt,
          borderBottom: `1px solid ${C.border}`,
        }}>
          {/* Pass rate */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              fontSize: 22, fontWeight: 700,
              color: summary.failed === 0 ? C.sage : C.amber,
            }}>
              {summary.passed}/{summary.total}
            </span>
            <MiniBar
              value={summary.passed} total={summary.total}
              color={summary.failed === 0 ? C.sage : C.amber}
            />
            <span style={{ fontSize: 11, color: C.inkMd, whiteSpace: 'nowrap' }}>
              {((summary.passed / summary.total) * 100).toFixed(0)}% pass
            </span>
          </div>

          {/* Issue counts */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {summary.tm  > 0 && <Badge ok={false} label={`Tone Mark ×${summary.tm}`} />}
            {summary.sp  > 0 && <Badge ok={false} label={`Spacing ×${summary.sp}`} />}
            {summary.lh  > 0 && <Badge ok={false} label={`Line-H ×${summary.lh}`} />}
            {summary.err > 0 && <Badge ok={false} label={`Error ×${summary.err}`} />}
            {summary.failed === 0 && <Badge ok label="ผ่านทั้งหมด" />}
          </div>
        </div>
      )}

      {/* ── Filter tabs ── */}
      {results && (
        <div style={{
          display: 'flex', gap: 0,
          borderBottom: `1px solid ${C.border}`,
          padding: '0 18px',
        }}>
          {[
            { key: 'all',  label: `ทั้งหมด (${summary.total})` },
            { key: 'fail', label: `❌ ล้มเหลว (${summary.failed})` },
            { key: 'pass', label: `✅ ผ่าน (${summary.passed})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '8px 12px', border: 'none', background: 'transparent',
                fontSize: 11, fontWeight: filter === tab.key ? 600 : 400,
                color: filter === tab.key ? C.ink : C.inkLt,
                borderBottom: filter === tab.key ? `2px solid ${C.ink}` : '2px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Result rows ── */}
      {results && (
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {visible.length === 0 && (
            <p style={{ padding: 24, textAlign: 'center', color: C.inkLt, fontSize: 12 }}>
              ไม่มีผลลัพธ์
            </p>
          )}

          {visible.map((r, idx) => {
            const issues = [
              r.renderError         && 'renderError',
              r.hasFloatingMark     && 'hasFloatingMark',
              r.hasWrongSpacing     && 'hasWrongSpacing',
              r.hasBrokenLineHeight && 'hasBrokenLineHeight',
            ].filter(Boolean)

            const isOpen = expanded === idx

            return (
              <div
                key={idx}
                style={{
                  borderBottom: `1px solid ${C.border}`,
                  background: isOpen ? C.bgMuted : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                {/* Row */}
                <div
                  onClick={() => setExpanded(isOpen ? null : idx)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 18px', cursor: 'pointer',
                  }}
                >
                  {/* Pass/fail dot */}
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: r.pass ? C.sage : C.blush,
                  }} />

                  {/* Input text */}
                  <span style={{
                    flex: 1, fontSize: 13, color: C.ink,
                    fontFamily: 'system-ui, sans-serif',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {r.input}
                  </span>

                  {/* Issue badges */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {issues.map(key => {
                      const m = ISSUE_META[key]
                      return (
                        <span key={key} style={{
                          padding: '1px 5px', borderRadius: 4,
                          fontSize: 9, fontWeight: 700,
                          background: m.color + '22', color: m.color,
                          border: `1px solid ${m.color}44`,
                        }}>
                          {m.short}
                        </span>
                      )
                    })}
                    {r.pass && (
                      <span style={{ fontSize: 11, color: C.sage }}>✓</span>
                    )}
                  </div>

                  {/* Chevron */}
                  <span style={{
                    fontSize: 10, color: C.inkLt,
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}>▼</span>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{
                    padding: '0 18px 12px 36px',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    {/* Full input */}
                    <pre style={{
                      margin: 0, padding: '6px 10px',
                      background: C.bgCard, border: `1px solid ${C.border}`,
                      borderRadius: 6, fontSize: 12, color: C.ink,
                      fontFamily: 'system-ui, sans-serif',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    }}>
                      {r.input}
                    </pre>

                    {/* Check results */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Badge ok={!r.hasFloatingMark}     label="Tone Mark" />
                      <Badge ok={!r.hasWrongSpacing}     label="Spacing" />
                      <Badge ok={!r.hasBrokenLineHeight} label="Line Height" />
                    </div>

                    {/* Render error */}
                    {r.renderError && (
                      <p style={{
                        margin: 0, padding: '6px 10px',
                        background: C.blushLt, border: `1px solid ${C.blushMd}`,
                        borderRadius: 6, fontSize: 11, color: C.blush,
                        fontFamily: 'monospace',
                      }}>
                        Error: {r.renderError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Empty state ── */}
      {!results && !running && (
        <div style={{
          padding: 36, textAlign: 'center', color: C.inkLt,
        }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>🇹🇭</p>
          <p style={{ fontSize: 13, margin: 0 }}>กด "รัน Audit" เพื่อทดสอบ {new Intl.NumberFormat().format(22)} ประโยค</p>
          <p style={{ fontSize: 11, color: C.inkLt, marginTop: 4 }}>
            ตรวจ: Floating tone mark · Wrong spacing · Broken line-height
          </p>
        </div>
      )}

    </div>
  )
}