/**
 * Step3 – Preview / Adjust / Validate
 *
 * ARCHITECTURE ROLE: Pure consumer + glyph extractor.
 *
 * Props:
 *   parsedFile  – from appState.parsedFile (set by Step 2)
 *   onGlyphsUpdate(glyphs[]) – called whenever extracted glyphs change
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import Btn from "../../components/Btn"
import InfoBox from "../../components/InfoBox"
import C from "../../styles/colors"
import { buildAutoPageProfiles } from "../../domains/glyph-extraction/pipeline/calibration.js"
import { getGridGeometry, traceAllGlyphs } from "../../domains/glyph-extraction/pipeline/glyphPipeline.js"
import {
  ZERO_CALIBRATION,
} from "../../domains/glyph-extraction/constants.js"
import { Adjuster, GridDebugOverlay, PageDebugOverlay } from "./panels/Step3Panels.jsx"
import DebugOverlay from "../../components/DebugOverlay.jsx"

// Engine imports
import { PipelineStateMachine, PipelineStates } from "../../engine/PipelineStateMachine.js"
import { Telemetry } from "../../engine/Telemetry.js"
import { PerformanceGovernor } from "../../engine/PerformanceGovernor.js"

// Vision Engine imports
import { VisionEngine } from "../../domains/glyph-extraction/vision/VisionEngine.js"
import QADashboard from "../../components/QADashboard.jsx"