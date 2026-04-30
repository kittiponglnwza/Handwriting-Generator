// ExportButtons.jsx — TTF / WOFF / ZIP / JSON download buttons
import Btn from '../../shared/components/Btn'
import C from '../../styles/colors'
import {
  downloadBuffer,
  downloadJSON,
  downloadFontZip,
} from '../../engine/font/exportAdapters/index.js'

export function ExportButtons({ fontName, buildResult, buildLog, onRebuild, buildState }) {
  if (!buildResult) return null

  const handleDownloadTTF  = () => downloadBuffer(buildResult.ttfBuffer,  `${fontName}.ttf`,  'font/ttf')
  const handleDownloadWOFF = () => downloadBuffer(buildResult.woffBuffer, `${fontName}.woff`, 'font/woff')
  const handleDownloadMeta = () => downloadJSON(buildResult.metadata,       'metadata.json')
  const handleDownloadMap  = () => downloadJSON(buildResult.exportGlyphMap, 'glyphMap.json')
  const handleDownloadZip  = () => downloadFontZip({
    fontName,
    ttfBuffer:   buildResult.ttfBuffer,
    woffBuffer:  buildResult.woffBuffer,
    glyphMapObj: buildResult.exportGlyphMap,
    metadataObj: buildResult.metadata,
    buildLog:    buildLog.map(e => `[${e.level.toUpperCase()}] ${e.msg}`),
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Primary: TTF */}
      <div style={{ background: '#1A1410', border: '1px solid #2C2416', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#F0EBE0' }}>{fontName}.ttf</p>
          <p style={{ fontSize: 11, color: '#7A6E58', marginTop: 3 }}>TrueType · {buildResult.glyphCount} glyphs · ready to install</p>
        </div>
        <button onClick={handleDownloadTTF} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F0EBE0', color: '#1A1410', border: 'none', borderRadius: 10, padding: '11px 28px', fontSize: 13, cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}>
          ⬇ Download .ttf
        </button>
      </div>

      {/* Secondary downloads */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn onClick={handleDownloadWOFF} variant="ghost" size="sm">⬇ .woff</Btn>
        <Btn onClick={handleDownloadZip}  variant="ghost" size="sm">⬇ Full ZIP</Btn>
        <Btn onClick={handleDownloadMeta} variant="ghost" size="sm">⬇ metadata.json</Btn>
        <Btn onClick={handleDownloadMap}  variant="ghost" size="sm">⬇ glyphMap.json</Btn>
        {buildState === 'done' && (
          <Btn onClick={onRebuild} variant="ghost" size="sm">↺ Rebuild</Btn>
        )}
      </div>
    </div>
  )
}
