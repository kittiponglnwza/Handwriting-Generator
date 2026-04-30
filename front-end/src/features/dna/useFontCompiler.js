// useFontCompiler.js — encapsulates font build logic from DnaStep
import { useCallback, useRef, useState } from 'react'
import {
  buildGlyphMap,
  compileFontBuffer,
  buildMetadata,
  buildExportGlyphMap,
} from '../../engine/font/fontBuilder.js'

export function useFontCompiler({ glyphs, fontName, onFontReady }) {
  const [buildState,  setBuildState]  = useState('idle')
  const [progress,    setProgress]    = useState({ pct: 0, label: '' })
  const [buildResult, setBuildResult] = useState(null)
  const [buildLog,    setBuildLog]    = useState([])
  const [errorMsg,    setErrorMsg]    = useState('')
  const [buildSeed,   setBuildSeed]   = useState(() => Math.random())

  const buildStateRef = useRef(buildState)
  buildStateRef.current = buildState

  const glyphMap = buildGlyphMap && glyphs.length > 0
    ? null // lazily built inside compile
    : new Map()

  const compile = useCallback(async (glyphMapArg, seedArg) => {
    if (buildStateRef.current === 'building') return
    setBuildState('building')
    setErrorMsg('')
    setBuildResult(null)
    setBuildLog([])

    const onProgress = (msg, pct, logEntry) => {
      setProgress({ pct: pct ?? 0, label: msg })
      if (logEntry) setBuildLog(prev => [...prev, logEntry])
    }

    try {
      await new Promise(r => setTimeout(r, 60))
      const result = await compileFontBuffer(glyphMapArg, fontName, onProgress, seedArg)
      const { ttfBuffer, woffBuffer, glyphCount, skipped, buildLog: newLog, glyphInfo, featureStatus, puaMap } = result

      setBuildLog(newLog)
      const exportGlyphMap = buildExportGlyphMap(glyphMapArg, glyphInfo)
      const metadata       = buildMetadata({ fontName, glyphMap: glyphMapArg, glyphInfo, glyphCount, skipped, featureStatus })

      const res = { ttfBuffer, woffBuffer, glyphCount, skipped, glyphInfo, exportGlyphMap, metadata, featureStatus, puaMap }
      setBuildResult(res)
      setBuildState('done')
      onFontReady?.({ ttfBuffer, puaMap })
      return res
    } catch (err) {
      console.error('[useFontCompiler] Build failed:', err)
      setErrorMsg(err.message || 'Unknown compilation error')
      setBuildState('error')
      setBuildLog(prev => [...prev, { level: 'error', msg: `Build failed: ${err.message}`, ts: Date.now() }])
    }
  }, [fontName, onFontReady])

  const reset = useCallback(() => {
    setBuildState('idle')
    setBuildResult(null)
    setProgress({ pct: 0, label: '' })
  }, [])

  return { buildState, progress, buildResult, buildLog, errorMsg, buildSeed, setBuildSeed, compile, reset }
}
