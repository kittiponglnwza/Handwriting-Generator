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
import Btn from "../../shared/components/Btn"
import InfoBox from "../../shared/components/InfoBox"
import C from "../../styles/colors"
import { buildAutoPageProfiles } from "../../engine/vision/calibration.js"
import { getGridGeometry, traceAllGlyphs } from "../../engine/vision/glyphPipeline.js"
import {
  ZERO_CALIBRATION,
} from "../../engine/vision/constants.js"
import { Adjuster, GridDebugOverlay, PageDebugOverlay } from "./ExtractionPanels.jsx"
import DebugOverlay from "../../shared/debug/DebugOverlay.jsx"

// Engine imports
import { PipelineStateMachine, PipelineStates } from "../../engine/pipeline/PipelineStateMachine.js"
import { Telemetry } from "../../engine/pipeline/Telemetry.js"
import { PerformanceGovernor } from "../../engine/pipeline/PerformanceGovernor.js"

// Vision Engine imports
import { VisionEngine } from "../../engine/vision/VisionEngine.js"
import QADashboard from "../../shared/debug/QADashboard.jsx"