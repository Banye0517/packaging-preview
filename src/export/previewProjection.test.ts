import { PerspectiveCamera } from 'three'
import { describe, expect, it, vi } from 'vitest'

import { applyExportFrameProjection, getExportPreset } from './exportFrame'

describe('applyExportFrameProjection', () => {
  it('updates only projection when the export ratio changes', () => {
    const camera = new PerspectiveCamera(38, 1)
    camera.position.set(7, 5, 9)
    camera.rotation.set(0.2, -0.4, 0.1)
    camera.updateProjectionMatrix = vi.fn()
    const position = camera.position.clone()
    const quaternion = camera.quaternion.clone()

    applyExportFrameProjection(camera, 1200, 800, getExportPreset('portrait-2k'))

    expect(camera.position.equals(position)).toBe(true)
    expect(camera.quaternion.equals(quaternion)).toBe(true)
    expect(camera.aspect).toBe(1.5)
    expect(camera.fov).toBeGreaterThan(38)
    expect(camera.updateProjectionMatrix).toHaveBeenCalledOnce()
  })
})
