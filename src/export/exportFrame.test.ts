import { describe, expect, it } from 'vitest'

import {
  calculateExportFrameRect,
  calculatePreviewFov,
  calculatePreviewStageLayout,
  EXPORT_PRESETS,
  getExportFramePadding,
  getExportPreset,
  rectsOverlap,
} from './exportFrame'

describe('exportFrame', () => {
  it('defines the four supported export sizes', () => {
    expect(EXPORT_PRESETS.map(({ width, height }) => [width, height])).toEqual([
      [800, 800],
      [3000, 3000],
      [2560, 1440],
      [1440, 2560],
    ])
  })

  it('centers a landscape frame inside the padded viewport', () => {
    const frame = calculateExportFrameRect(1200, 800, getExportPreset('landscape-2k'), 56)

    expect(frame.width / frame.height).toBeCloseTo(16 / 9)
    expect(frame.left).toBeCloseTo((1200 - frame.width) / 2)
    expect(frame.top).toBeCloseTo((800 - frame.height) / 2)
  })

  it('uses overscan fov so the fixed frame matches the export crop', () => {
    const frame = calculateExportFrameRect(1200, 800, getExportPreset('portrait-2k'), 56)
    const previewFov = calculatePreviewFov(38, 800, frame.height)
    const previewHalfHeight = Math.tan(previewFov * Math.PI / 360)
    const frameHalfHeight = previewHalfHeight * frame.height / 800

    expect(frameHalfHeight).toBeCloseTo(Math.tan(38 * Math.PI / 360), 6)
    const previewHalfWidth = previewHalfHeight * (1200 / 800)
    const frameHalfWidth = previewHalfWidth * frame.width / 1200
    expect(frameHalfWidth).toBeCloseTo(Math.tan(38 * Math.PI / 360) * (1440 / 2560), 6)
  })

  it('uses the same responsive padding source for desktop and mobile', () => {
    expect(getExportFramePadding(1200)).toBe(56)
    expect(getExportFramePadding(390)).toBe(34)
  })

  it.each([
    [1120, 820, 'square-standard'],
    [1120, 820, 'landscape-2k'],
    [1120, 820, 'portrait-2k'],
    [390, 430, 'portrait-2k'],
  ] as const)('keeps tool rails outside the export frame at %sx%s %s', (width, height, presetId) => {
    const layout = calculatePreviewStageLayout(width, height, getExportPreset(presetId))

    expect(rectsOverlap(layout.frame, layout.primaryToolbar)).toBe(false)
    expect(rectsOverlap(layout.frame, layout.cameraToolbar)).toBe(false)
    expect(layout.frame.width / layout.frame.height).toBeCloseTo(
      getExportPreset(presetId).width / getExportPreset(presetId).height,
    )
  })
})
