import { describe, expect, it } from 'vitest'

import { getStudioLighting } from './studioLighting'

describe('studio lighting', () => {
  it('keeps one upper-left key direction while changing real light energy', () => {
    const weak = getStudioLighting(-100)
    const neutral = getStudioLighting(0)
    const strong = getStudioLighting(100)

    expect(weak.keyPosition).toEqual(neutral.keyPosition)
    expect(strong.keyPosition).toEqual(neutral.keyPosition)
    expect(neutral.keyPosition[0]).toBeLessThan(0)
    expect(neutral.keyPosition[1]).toBeGreaterThan(0)
    expect(weak.keyIntensity).toBeLessThan(neutral.keyIntensity)
    expect(neutral.keyIntensity).toBeLessThan(strong.keyIntensity)
    expect(weak.fillIntensity).toBeLessThan(neutral.fillIntensity)
    expect(neutral.fillIntensity).toBeLessThan(strong.fillIntensity)
  })

  it('clamps values outside the user-facing range', () => {
    expect(getStudioLighting(-200)).toEqual(getStudioLighting(-100))
    expect(getStudioLighting(200)).toEqual(getStudioLighting(100))
  })
})
