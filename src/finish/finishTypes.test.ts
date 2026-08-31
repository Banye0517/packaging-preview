import { describe, expect, it } from 'vitest'

import { BOX_FACES } from '../app/types'
import { FINISH_KINDS, createDefaultBoxFinish } from './finishTypes'

describe('box finish defaults', () => {
  it('creates five independent layers with six empty face masks', () => {
    const finish = createDefaultBoxFinish()

    expect(Object.keys(finish.layers)).toEqual(FINISH_KINDS)
    expect(finish.selectedKind).toBe('gold-foil')
    for (const kind of FINISH_KINDS) {
      expect(Object.keys(finish.layers[kind].masks)).toEqual([...BOX_FACES])
      expect(Object.values(finish.layers[kind].masks).every((mask) => mask === null)).toBe(true)
    }
  })
})
