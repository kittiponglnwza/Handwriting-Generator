import { lazy, Suspense, useEffect, useMemo, useState } from "react"
import ErrorBoundary from "../shared/components/ErrorBoundary"
import AppLayout from "./AppLayout"
import { INITIAL_STATE, canOpenStep } from "./AppState"
import { STEPS } from "./routes"
import { buildVersionedGlyphs } from "../shared/glyph/glyphVersions.js"
import { usePipeline } from "../hooks/usePipeline.js"

import Step1 from "../features/template/TemplateStep"
import Step2 from "../features/upload/UploadStep"
import Step3 from "../features/extraction/ExtractionStep"

// Heavy steps — lazy loaded to keep initial bundle small
const Step4 = lazy(() => import("../features/dna/DnaStep"))
const Step5 = lazy(() => import("../features/preview/PreviewStep"))

function StepLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
      <div className="spinner" />
    </div>
  )
}

export default function App({ onLogout }) {
  const [step, setStep] = useState(1)
  const [appState, setAppState] = useState(INITIAL_STATE)
  const pipeline = usePipeline()

  // Build versioned glyphs whenever extraction result changes
  useEffect(() => {
    const glyphs = appState.glyphResult?.glyphs ?? []
    if (glyphs.length === 0) {
      setAppState(prev => ({ ...prev, versionedGlyphs: [] }))
      return
    }
    setAppState(prev => ({ ...prev, versionedGlyphs: buildVersionedGlyphs(glyphs) }))
  }, [appState.glyphResult])

  // Navigation guard — never show a locked step
  const effectiveStep = canOpenStep(step, appState)
    ? step
    : ([4, 3, 2, 1].find(s => canOpenStep(s, appState)) ?? 2)

  useEffect(() => {
    if (effectiveStep !== step) setStep(effectiveStep)
  }, [effectiveStep, step])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleParsed        = (parsedFile) => setAppState({ ...INITIAL_STATE, parsedFile })
  const handleClearPdf      = () => setAppState(INITIAL_STATE)
  const handleFontReady     = ({ ttfBuffer, puaMap }) =>
    setAppState(prev => ({ ...prev, ttfBuffer, puaMap: puaMap ?? null }))
  const handleGlyphsUpdate  = (glyphs) =>
    setAppState(prev => ({
      ...prev,
      glyphResult: { glyphs, validationStatus: glyphs.length > 0 ? "ok" : "empty" },
    }))
  const handleFontStyleChange = (key, value) =>
    setAppState(prev => ({ ...prev, fontStyle: { ...prev.fontStyle, [key]: value } }))
  const handleNext = () => setStep(s => Math.min(STEPS.length, s + 1))

  // ── Derived values ───────────────────────────────────────────────────────────
  const activeStep = effectiveStep

  const sidebarGlyphCount = useMemo(() => {
    if (appState.glyphResult?.glyphs?.length > 0)
      return `${appState.glyphResult.glyphs.length} glyphs`
    if (appState.parsedFile?.metadata?.detectedSlots > 0)
      return `${appState.parsedFile.metadata.detectedSlots} slots`
    return "—"
  }, [appState.parsedFile, appState.glyphResult])

  const canNext = useMemo(() => {
    switch (activeStep) {
      case 1: return true
      case 2: return appState.parsedFile?.status === "parsed"
      case 3: return (appState.glyphResult?.glyphs?.length ?? 0) > 0
      case 4: return appState.versionedGlyphs.length > 0
      default: return false
    }
  }, [activeStep, appState])

  return (
    <AppLayout
      activeStep={activeStep}
      steps={STEPS}
      appState={appState}
      canNext={canNext}
      sidebarGlyphCount={sidebarGlyphCount}
      onStepSelect={setStep}
      onNext={handleNext}
      onBack={() => setStep(s => s - 1)}
      onLogout={onLogout}
    >
      {/* Step 4 stays mounted once glyphs exist to preserve ttfBuffer */}
      {(appState.glyphResult?.glyphs?.length ?? 0) > 0 && (
        <div style={{ display: activeStep === 4 ? "contents" : "none" }}>
          <ErrorBoundary key={`step4-${appState.parsedFile?.file?.name}`}>
            <Suspense fallback={<StepLoader />}>
              <Step4
                glyphs={appState.glyphResult?.glyphs ?? []}
                fontStyle={appState.fontStyle}
                onFontStyleChange={handleFontStyleChange}
                onFontReady={handleFontReady}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}

      {activeStep === 1 && <ErrorBoundary key="step1"><Step1 /></ErrorBoundary>}

      {activeStep === 2 && (
        <ErrorBoundary key="step2">
          <Step2 parsedFile={appState.parsedFile} onParsed={handleParsed} onClear={handleClearPdf} />
        </ErrorBoundary>
      )}

      {activeStep === 3 && (
        <ErrorBoundary key={`step3-${appState.parsedFile?.file?.name}`}>
          <Step3
            parsedFile={appState.parsedFile}
            onGlyphsUpdate={handleGlyphsUpdate}
            pipelineMachine={pipeline.machine}
          />
        </ErrorBoundary>
      )}

      {activeStep === 5 && (
        <ErrorBoundary key="step5">
          <Suspense fallback={<StepLoader />}>
            <Step5
              versionedGlyphs={appState.versionedGlyphs}
              extractedGlyphs={appState.glyphResult?.glyphs ?? []}
              ttfBuffer={appState.ttfBuffer}
              puaMap={appState.puaMap}
              fontStyle={appState.fontStyle}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </AppLayout>
  )
}