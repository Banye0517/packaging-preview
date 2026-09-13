import { describe, expect, it } from 'vitest'

import { calculateProjectedRects, calculateVisibleFraction, getRequiredRearSupportHeight } from './projectedVisibility'

describe('projected pedestal visibility', () => {
  it('calculates the visible fraction after a front rectangle covers the rear bottom', () => {
    expect(calculateVisibleFraction(
      { left: 0, top: 0, right: 100, bottom: 100 },
      [{ left: 0, top: 80, right: 100, bottom: 100 }],
    )).toBeCloseTo(0.8)
  })

  it('raises a rear package until 80 percent of its height clears an overlapping front package', () => {
    expect(getRequiredRearSupportHeight({ minY: 0, maxY: 2 }, 3, 0.8)).toBeCloseTo(2.6)
  })

  it('projects world-space package bounds through the default perspective camera', () => {
    const rectangles = calculateProjectedRects([
      { id: 'front', min: [-1, 0, 1], max: [1, 2, 2] },
      { id: 'rear', min: [-1, 1, -2], max: [1, 3, -1] },
    ])

    expect(rectangles.get('front')).toBeDefined()
    expect(rectangles.get('rear')).toBeDefined()
    expect(rectangles.get('rear')!.top).toBeLessThan(rectangles.get('front')!.bottom)
  })
})
