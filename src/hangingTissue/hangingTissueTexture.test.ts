import { describe, expect, it, vi } from 'vitest'
import { BufferGeometry, Float32BufferAttribute } from 'three'

import type { ArtworkTransform } from '../app/types'
import {
  drawHangingTissueAtlas,
  extractHangingTissueUvRegions,
} from './hangingTissueTexture'

const transform: ArtworkTransform = {
  scale: 100, offsetX: 0, offsetY: 0, rotation: 0, stretchX: 100, stretchY: 100,
}

function createFourFaceGeometry() {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([
    -1, -1, 1, 1, -1, 1, 0, 1, 1,
    -1, -1, -1, 0, 1, -1, 1, -1, -1,
    -1, -1, 0, -1, 1, 0, -1, -1, 1,
    1, -1, 0, 1, -1, 1, 1, 1, 0,
  ], 3))
  geometry.setAttribute('normal', new Float32BufferAttribute([
    0, 0, 1, 0, 0, 1, 0, 0, 1,
    0, 0, -1, 0, 0, -1, 0, 0, -1,
    -1, 0, 0, -1, 0, 0, -1, 0, 0,
    1, 0, 0, 1, 0, 0, 1, 0, 0,
  ], 3))
  geometry.setAttribute('uv', new Float32BufferAttribute([
    0.05, 0.1, 0.25, 0.1, 0.15, 0.9,
    0.35, 0.1, 0.45, 0.9, 0.55, 0.1,
    0.6, 0.2, 0.7, 0.2, 0.65, 0.8,
    0.75, 0.2, 0.95, 0.2, 0.85, 0.8,
  ], 2))
  geometry.setIndex([...Array(12).keys()])
  return geometry
}

describe('hanging tissue texture atlas', () => {
  it('extracts front, back, left, and right UV bounds from face normals', () => {
    const regions = extractHangingTissueUvRegions(createFourFaceGeometry())
    expect(regions.front).toMatchObject({ minU: expect.closeTo(0.05), maxU: expect.closeTo(0.25), minV: expect.closeTo(0.1), maxV: expect.closeTo(0.9) })
    expect(regions.back).toMatchObject({ minU: expect.closeTo(0.35), maxU: expect.closeTo(0.55), minV: expect.closeTo(0.1), maxV: expect.closeTo(0.9) })
    expect(regions.left).toMatchObject({ minU: expect.closeTo(0.6), maxU: expect.closeTo(0.7), minV: expect.closeTo(0.2), maxV: expect.closeTo(0.8) })
    expect(regions.right).toMatchObject({ minU: expect.closeTo(0.75), maxU: expect.closeTo(0.95), minV: expect.closeTo(0.2), maxV: expect.closeTo(0.8) })
  })

  it('rejects geometry without an index', () => {
    const geometry = createFourFaceGeometry()
    geometry.setIndex(null)
    expect(() => extractHangingTissueUvRegions(geometry)).toThrow(
      'Hanging tissue model contains no index',
    )
  })

  it('clips each selected image to its own UV region', () => {
    const context = {
      fillStyle: '', fillRect: vi.fn(), save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(),
      rect: vi.fn(), clip: vi.fn(), translate: vi.fn(), rotate: vi.fn(), drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const image = { width: 600, height: 1200 } as HTMLImageElement
    const regions = extractHangingTissueUvRegions(createFourFaceGeometry())

    drawHangingTissueAtlas(context, 1000, {
      front: { image, transform },
      left: { image, transform: { ...transform, offsetX: 25 } },
    }, regions)

    expect(context.clip).toHaveBeenCalledTimes(2)
    expect(vi.mocked(context.rect).mock.calls[0]).toEqual([
      expect.closeTo(50), expect.closeTo(100), expect.closeTo(200), expect.closeTo(800),
    ])
    expect(vi.mocked(context.rect).mock.calls[1]).toEqual([
      expect.closeTo(600), expect.closeTo(200), expect.closeTo(100), expect.closeTo(600),
    ])
    expect(context.drawImage).toHaveBeenCalledTimes(2)
  })
})
