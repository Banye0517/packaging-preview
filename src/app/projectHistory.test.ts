import { describe, expect, it } from 'vitest'

import { createProjectHistory, projectHistoryReducer } from './projectHistory'

describe('projectHistoryReducer', () => {
  it('undoes and redoes a committed box change', () => {
    const initial = createProjectHistory()
    const changed = projectHistoryReducer(initial, {
      type: 'commit',
      action: { type: 'box/set', key: 'width', value: 240 },
    })
    const undone = projectHistoryReducer(changed, { type: 'undo' })
    const redone = projectHistoryReducer(undone, { type: 'redo' })

    expect(changed.present.box.width).toBe(240)
    expect(undone.present.box.width).toBe(initial.present.box.width)
    expect(redone.present.box.width).toBe(240)
  })

  it('resets the project and preserves the previous state for undo', () => {
    const changed = projectHistoryReducer(createProjectHistory(), {
      type: 'commit',
      action: { type: 'box/set', key: 'height', value: 310 },
    })
    const reset = projectHistoryReducer(changed, { type: 'reset' })

    expect(reset.present.box.height).toBe(220)
    expect(reset.past.at(-1)?.box.height).toBe(310)
  })
})
