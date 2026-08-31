import { describe, expect, it } from 'vitest'

import {
  createRoundedBoxGeometry,
  getRoundedBoxDimensions,
} from './roundedBoxGeometry'

describe('createRoundedBoxGeometry', () => {
  it('converts the millimeter radius into visible scene units', () => {
    const sharp = createRoundedBoxGeometry({
      width: 160,
      height: 220,
      depth: 70,
      radius: 0,
    })
    const rounded = createRoundedBoxGeometry({
      width: 160,
      height: 220,
      depth: 70,
      radius: 11,
    })

    expect(
      getRoundedBoxDimensions({ width: 160, height: 220, depth: 70, radius: 0 })
        .radius,
    ).toBe(0)
    expect(
      getRoundedBoxDimensions({ width: 160, height: 220, depth: 70, radius: 11 })
        .radius,
    ).toBeCloseTo(0.18, 2)
    expect(rounded.groups).toHaveLength(6)

    sharp.dispose()
    rounded.dispose()
  })
})
