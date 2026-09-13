import { describe, expect, it } from 'vitest'

import { getSafePedestalRadius } from './pedestalRadius'

describe('getSafePedestalRadius', () => {
  it('converts millimeters and clamps the result to every block dimension', () => {
    expect(getSafePedestalRadius(8, 4, 1, 3)).toBeCloseTo(8 * (3.6 / 220))
    expect(getSafePedestalRadius(30, 1, 0.3, 1)).toBeLessThan(0.15)
    expect(getSafePedestalRadius(0, 1, 1, 1)).toBe(0)
  })
})
