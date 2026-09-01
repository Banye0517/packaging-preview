import { describe, expect, it, vi } from 'vitest'
import { BufferGeometry, Float32BufferAttribute } from 'three'

import type { ArtworkTransform, HangingTissueDimensions } from '../app/types'
import {
  calculateArtworkDimensionCompensation,
  drawHangingTissueAtlas,
  extractHangingTissueFaceGeometrySet,
  extractHangingTissueFaceGeometries,
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
    0.55, 0.1, 0.65, 0.9, 0.75, 0.1,
    0.83, 0.2, 0.97, 0.2, 0.9, 0.8,
    0.33, 0.2, 0.47, 0.2, 0.4, 0.8,
  ], 2))
  geometry.setIndex([...Array(12).keys()])
  return geometry
}

function createAuthoredIslandGeometry() {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([
    -1, -1, 3, 1, -1, 3, 0, 1, 3,
    3, -1, -1, 3, -1, 1, 3, 1, 0,
    -1, -1, -3, 0, 1, -3, 1, -1, -3,
    -3, -1, -1, -3, 1, 0, -3, -1, 1,
  ], 3))
  geometry.setAttribute('normal', new Float32BufferAttribute([
    0, 0, -1, 0, 0, -1, 0, 0, -1,
    -1, 0, 0, -1, 0, 0, -1, 0, 0,
    0, 0, 1, 0, 0, 1, 0, 0, 1,
    1, 0, 0, 1, 0, 0, 1, 0, 0,
  ], 3))
  geometry.setAttribute('uv', new Float32BufferAttribute([
    0.05, 0.1, 0.25, 0.1, 0.15, 0.9,
    0.33, 0.2, 0.47, 0.2, 0.4, 0.8,
    0.55, 0.1, 0.75, 0.9, 0.65, 0.1,
    0.83, 0.2, 0.9, 0.8, 0.97, 0.2,
  ], 2))
  geometry.setIndex([...Array(12).keys()])
  return geometry
}

describe('hanging tissue texture atlas', () => {
  it('counter-scales front and side artwork against their physical body dimensions', () => {
    const current: HangingTissueDimensions = { width: 320, height: 100, depth: 100 }
    const reference: HangingTissueDimensions = { width: 160, height: 200, depth: 80 }

    expect(calculateArtworkDimensionCompensation('front', current, reference)).toEqual({
      x: 0.5, y: 2,
    })
    expect(calculateArtworkDimensionCompensation('left', current, reference)).toEqual({
      x: 0.8, y: 2,
    })
  })

  it('extracts front, back, left, and right UV bounds from face normals', () => {
    const regions = extractHangingTissueUvRegions(createFourFaceGeometry())
    expect(regions.front).toMatchObject({ minU: expect.closeTo(0.05), maxU: expect.closeTo(0.25), minV: expect.closeTo(0.1), maxV: expect.closeTo(0.9) })
    expect(regions.back).toMatchObject({ minU: expect.closeTo(0.55), maxU: expect.closeTo(0.75), minV: expect.closeTo(0.1), maxV: expect.closeTo(0.9) })
    expect(regions.left).toMatchObject({ minU: expect.closeTo(0.83), maxU: expect.closeTo(0.97), minV: expect.closeTo(0.2), maxV: expect.closeTo(0.8) })
    expect(regions.right).toMatchObject({ minU: expect.closeTo(0.33), maxU: expect.closeTo(0.47), minV: expect.closeTo(0.2), maxV: expect.closeTo(0.8) })
  })

  it('rejects geometry without an index', () => {
    const geometry = createFourFaceGeometry()
    geometry.setIndex(null)
    expect(() => extractHangingTissueUvRegions(geometry)).toThrow(
      'Hanging tissue model contains no index',
    )
  })

  it('rejects geometry without positions before rebuilding face UVs', () => {
    const geometry = createFourFaceGeometry()
    geometry.deleteAttribute('position')
    expect(() => extractHangingTissueFaceGeometries(geometry)).toThrow(
      'Hanging tissue model contains no positions',
    )
  })

  it('creates separate face geometries even when their UV regions overlap', () => {
    const faces = extractHangingTissueFaceGeometries(createFourFaceGeometry())

    expect(faces.front.getIndex()?.count).toBe(3)
    expect(faces.back.getIndex()?.count).toBe(3)
    expect(faces.left.getIndex()?.count).toBe(3)
    expect(faces.right.getIndex()?.count).toBe(3)
    expect(faces.front.getIndex()?.getX(0)).toBe(0)
    expect(faces.left.getIndex()?.getX(0)).toBe(6)
  })

  it('keeps triangles outside the four authored UV islands as remainder geometry', () => {
    const geometry = createFourFaceGeometry()
    const position = geometry.getAttribute('position')
    const normal = geometry.getAttribute('normal')
    const uv = geometry.getAttribute('uv')
    geometry.setAttribute('position', new Float32BufferAttribute([
      ...position.array, -1, 1, -1, 1, 1, -1, 0, 1, 1,
    ], 3))
    geometry.setAttribute('normal', new Float32BufferAttribute([
      ...normal.array, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    ], 3))
    geometry.setAttribute('uv', new Float32BufferAttribute([
      ...uv.array, 1.1, 0, 1.2, 0, 1.15, 1,
    ], 2))
    geometry.setIndex([...Array(12).keys(), 12, 13, 14])

    const set = extractHangingTissueFaceGeometrySet(geometry)
    expect(set.faces.front.getIndex()?.count).toBe(3)
    expect(set.remainder.getIndex()?.count).toBe(3)
  })

  it('maps authored UV islands by physical panel position instead of inverted normals', () => {
    const faces = extractHangingTissueFaceGeometries(createAuthoredIslandGeometry())

    expect(faces.front.getIndex()?.getX(0)).toBe(0)
    expect(faces.right.getIndex()?.getX(0)).toBe(3)
    expect(faces.back.getIndex()?.getX(0)).toBe(6)
    expect(faces.left.getIndex()?.getX(0)).toBe(9)
  })

  it('preserves authored UV coordinates instead of planar remapping', () => {
    const source = createAuthoredIslandGeometry()
    const sourceUv = source.getAttribute('uv')
    const faces = extractHangingTissueFaceGeometries(source)
    const frontUv = faces.front.getAttribute('uv')

    expect(frontUv.getX(0)).toBeCloseTo(sourceUv.getX(0))
    expect(frontUv.getY(2)).toBeCloseTo(sourceUv.getY(2))
  })

  it('clips each selected image to its own UV region', () => {
    const context = {
      fillStyle: '', fillRect: vi.fn(), save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(),
      rect: vi.fn(), clip: vi.fn(), translate: vi.fn(), scale: vi.fn(), rotate: vi.fn(), drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const image = { width: 600, height: 1200 } as HTMLImageElement
    const regions = extractHangingTissueUvRegions(createFourFaceGeometry())

    drawHangingTissueAtlas(context, 1000, {
      front: {
        image,
        transform,
        currentDimensions: { width: 320, height: 100, depth: 100 },
        referenceDimensions: { width: 160, height: 200, depth: 80 },
      },
      left: { image, transform: { ...transform, offsetX: 25 } },
    }, regions)

    expect(context.clip).toHaveBeenCalledTimes(2)
    expect(vi.mocked(context.rect).mock.calls[0]).toEqual([
      expect.closeTo(50), expect.closeTo(100), expect.closeTo(200), expect.closeTo(800),
    ])
    expect(vi.mocked(context.rect).mock.calls[1]).toEqual([
      expect.closeTo(830), expect.closeTo(200), expect.closeTo(140), expect.closeTo(600),
    ])
    expect(context.drawImage).toHaveBeenCalledTimes(2)
    expect(context.scale).toHaveBeenCalledWith(0.5, 2)
  })
})
