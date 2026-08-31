import { describe, expect, it } from 'vitest'

import { CAMERA_POLAR_LIMITS, CAMERA_POSITIONS } from './cameraLimits'

describe('CAMERA_POLAR_LIMITS', () => {
  it('allows orbiting above and below the box', () => {
    expect(CAMERA_POLAR_LIMITS.min).toBeLessThan(0.1)
    expect(CAMERA_POLAR_LIMITS.max).toBeGreaterThan(Math.PI / 2)
    expect(CAMERA_POLAR_LIMITS.max).toBeGreaterThan(Math.PI - 0.1)
  })

  it('gives fit, front, and reset visibly distinct camera positions', () => {
    expect(new Set(Object.values(CAMERA_POSITIONS).map(String)).size).toBe(3)
    expect(CAMERA_POSITIONS.front[0]).toBe(0)
    expect(CAMERA_POSITIONS.fit[2]).toBeLessThan(CAMERA_POSITIONS.reset[2])
  })
})
