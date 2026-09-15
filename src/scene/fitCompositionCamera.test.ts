import { describe, expect, it } from 'vitest'
import { fitCompositionCamera, type CompositionBounds } from './fitCompositionCamera'
import { CAMERA_DISTANCE_LIMITS } from './cameraLimits'

const bounds = (min: [number, number, number], max: [number, number, number]): CompositionBounds => ({ min, max })

describe('fitCompositionCamera', () => {
  it('fits a square composition in a square viewport with a 12 percent margin', () => {
    const result = fitCompositionCamera({ bounds: bounds([-2, 0, -1], [2, 4, 1]), fov: 38, aspect: 1 })
    expect(result.target).toEqual([0, 2, 0])
    expect(result.position[0]).toBeCloseTo(0)
    expect(result.position[1]).toBeCloseTo(2)
    expect(result.position[2]).toBeGreaterThan(7)
  })

  it('fits a wide six-package composition farther away than a tall single package', () => {
    const tall = fitCompositionCamera({ bounds: [-1, 0, -1, 1, 10, 1], fov: 38, aspect: 1 })
    const wide = fitCompositionCamera({ bounds: [-18, 0, -1, 18, 4, 1], fov: 38, aspect: 2 })
    expect(wide.distance).toBeGreaterThan(tall.distance)
  })

  it('preserves a supplied observation direction and clamps distance limits', () => {
    const result = fitCompositionCamera({
      bounds: bounds([-1, -1, -1], [1, 1, 1]), fov: 38, aspect: 1,
      viewDirection: [1, 0, -1], distanceLimits: { min: 20, max: 21 },
    })
    expect(result.distance).toBe(20)
    expect(result.position[0]).toBeCloseTo(-result.position[2])
    expect(result.near).toBeGreaterThan(0)
    expect(result.far).toBeGreaterThan(result.distance)
    expect(CAMERA_DISTANCE_LIMITS.min).toBeLessThan(CAMERA_DISTANCE_LIMITS.max)
  })

  it('supports object and tuple bounds and keeps near/far finite', () => {
    const result = fitCompositionCamera({ bounds: [-0.1, 0, -0.1, 0.1, 0.2, 0.1], fov: 38, aspect: 1.777 })
    expect(Number.isFinite(result.near)).toBe(true)
    expect(Number.isFinite(result.far)).toBe(true)
    expect(result.near).toBeGreaterThan(0)
    expect(result.far).toBeGreaterThan(result.near)
  })

  it('keeps clipping planes safe while the user orbits around the composition', () => {
    const result = fitCompositionCamera({ bounds: [-8, 0, -5, 8, 6, 5], fov: 38, aspect: 1.7 })
    const radius = Math.hypot(8, 3, 5)
    const horizontalFov = 2 * Math.atan(Math.tan(38 * Math.PI / 360) * 1.7)
    const orbitSafeDistance = radius / Math.sin(Math.min(38 * Math.PI / 180, horizontalFov) / 2) * 1.12
    expect(result.near).toBe(0.01)
    expect(result.far).toBeGreaterThanOrEqual(result.distance + radius * 2)
    expect(result.distance).toBeGreaterThanOrEqual(orbitSafeDistance)
  })

  it('keeps the far plane beyond the maximum orbit distance', () => {
    const result = fitCompositionCamera({ bounds: [-2, 0, -1, 2, 4, 1], fov: 38, aspect: 1 })
    const radius = Math.hypot(2, 2, 1)

    expect(result.far).toBeGreaterThanOrEqual(CAMERA_DISTANCE_LIMITS.max + radius * 2)
  })
})
