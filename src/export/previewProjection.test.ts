import { PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it, vi } from 'vitest'

import { applyExportFrameProjection, calculatePreviewStageLayout, getExportPreset } from './exportFrame'

describe('applyExportFrameProjection', () => {
  it('updates only projection when the export ratio changes', () => {
    const camera = new PerspectiveCamera(38, 1)
    camera.position.set(7, 5, 9)
    camera.rotation.set(0.2, -0.4, 0.1)
    const updateProjectionMatrix = vi.spyOn(camera, 'updateProjectionMatrix')
    const position = camera.position.clone()
    const quaternion = camera.quaternion.clone()

    applyExportFrameProjection(camera, 1200, 800, getExportPreset('portrait-2k'))

    expect(camera.position.equals(position)).toBe(true)
    expect(camera.quaternion.equals(quaternion)).toBe(true)
    expect(camera.aspect).toBeCloseTo(9 / 16)
    expect(camera.fov).toBe(38)
    expect(updateProjectionMatrix).toHaveBeenCalledOnce()
  })

  it('maps the centered export projection exactly into an offset preview frame', () => {
    const camera = new PerspectiveCamera(38, 1)
    const preset = getExportPreset('portrait-2k')
    const viewport = { width: 1200, height: 800 }
    const frame = calculatePreviewStageLayout(viewport.width, viewport.height, preset).frame

    applyExportFrameProjection(camera, viewport.width, viewport.height, preset)
    const center = new Vector3(0, 0, -5).project(camera)
    const frameCenter = {
      x: (center.x + 1) * viewport.width / 2,
      y: (1 - center.y) * viewport.height / 2,
    }

    expect(frameCenter.x).toBeCloseTo(frame.left + frame.width / 2, 4)
    expect(frameCenter.y).toBeCloseTo(frame.top + frame.height / 2, 4)
  })
})
