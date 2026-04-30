/**
 * @file pipeline.d.ts
 * Type definitions for pipeline state machine.
 */

export type PipelineStateValue =
  | 'idle'
  | 'calibrating'
  | 'extracting'
  | 'tracing'
  | 'composing'
  | 'done'
  | 'error'

export interface CalibrationData {
  scaleX: number
  scaleY: number
  offsetX: number
  offsetY: number
}
