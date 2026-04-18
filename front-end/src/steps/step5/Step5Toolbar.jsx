function buttonTone(tone) {
  if (tone === "brand") {
    return "border-transparent bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-300"
  }
  if (tone === "ghost") {
    return "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:text-slate-300"
  }
  return "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-300"
}

function ToolbarButton({ children, onClick, disabled = false, tone = "default", title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition ${buttonTone(tone)}`}
    >
      {children}
    </button>
  )
}

function DropdownAction({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
    >
      {children}
    </button>
  )
}

function FontStatusTag({ fontState }) {
  const tone =
    fontState.status === "ready"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : fontState.status === "loading"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-rose-50 text-rose-700 ring-rose-200"

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${tone}`}>
      {fontState.message}
    </span>
  )
}

export default function Step5Toolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onExportPng,
  onExportTransparentPng,
  onExportPdf,
  onDownloadFont,
  onSaveDesignJson,
  onToggleFullscreen,
  fontState,
}) {
  return (
    <header className="step5-card rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 px-3 py-3 md:px-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Smart Preview</p>
          <p className="text-xs text-slate-500">1) Type text  2) Tune style  3) Export</p>
        </div>
        <div className="ml-auto">
          <FontStatusTag fontState={fontState} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-3 md:p-4">
        <ToolbarButton onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          Undo
        </ToolbarButton>
        <ToolbarButton onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
          Redo
        </ToolbarButton>
        <ToolbarButton onClick={onReset} tone="ghost" title="Reset all controls to default">
          Reset
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <ToolbarButton onClick={onExportPng} tone="brand">
          Export PNG
        </ToolbarButton>
        <ToolbarButton onClick={onExportPdf} tone="ghost">
          Export PDF
        </ToolbarButton>

        <details className="relative">
          <summary className="inline-flex h-9 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            More Actions
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <DropdownAction onClick={onExportTransparentPng}>
              Transparent PNG
            </DropdownAction>
            <DropdownAction onClick={onDownloadFont}>
              Download Font
            </DropdownAction>
            <DropdownAction onClick={onSaveDesignJson}>
              Save Design JSON
            </DropdownAction>
            <DropdownAction onClick={onToggleFullscreen}>
              Fullscreen
            </DropdownAction>
          </div>
        </details>

        <div className="ml-auto text-[11px] font-medium text-slate-500">
          Tip: Hold `Ctrl` + mouse wheel to zoom preview
        </div>
      </div>
    </header>
  )
}
