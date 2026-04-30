// PipelineStateMachine.test.js
import { PipelineStateMachine, PipelineStates } from '../../../engine/pipeline/PipelineStateMachine.js'

describe('PipelineStateMachine', () => {
  it('initializes in IDLE state', () => {
    const m = new PipelineStateMachine()
    expect(m.getCurrentState().state).toBe(PipelineStates.IDLE)
  })

  it('transitions state and notifies observers', () => {
    const m = new PipelineStateMachine()
    const changes = []
    m.subscribe({ onStateChange: (s) => changes.push(s) })
    m.transition(PipelineStates.CALIBRATING)
    m.transition(PipelineStates.EXTRACTING)
    expect(changes).toEqual([PipelineStates.CALIBRATING, PipelineStates.EXTRACTING])
  })

  it('unsubscribes observer', () => {
    const m = new PipelineStateMachine()
    const calls = []
    const unsub = m.subscribe({ onStateChange: (s) => calls.push(s) })
    m.transition(PipelineStates.CALIBRATING)
    unsub()
    m.transition(PipelineStates.EXTRACTING)
    expect(calls.length).toBe(1)
  })
})
