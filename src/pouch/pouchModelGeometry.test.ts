import { BoxGeometry } from 'three'
import { describe, expect, it } from 'vitest'

import { fitPouchGeometry, partitionPouchGeometry } from './pouchModelGeometry'

describe('pouch model geometry', () => {
  it('partitions one closed mesh into front, back and structural surfaces without losing triangles', () => {
    const source = new BoxGeometry(2, 0.5, 3).toNonIndexed()
    const sourceTriangles = source.getAttribute('position').count / 3

    const parts = partitionPouchGeometry(source, 'y')
    const triangleCount = (geometry: typeof source) =>
      geometry.getAttribute('position').count / 3

    expect(triangleCount(parts.front)).toBeGreaterThan(0)
    expect(triangleCount(parts.back)).toBeGreaterThan(0)
    expect(triangleCount(parts.structure)).toBeGreaterThan(0)
    expect(
      triangleCount(parts.front) +
      triangleCount(parts.back) +
      triangleCount(parts.structure),
    ).toBe(sourceTriangles)

    Object.values(parts).forEach((geometry) => geometry.dispose())
    source.dispose()
  })

  it('keeps top, bottom and side triangles in the structural part', () => {
    const source = new BoxGeometry(2, 0.5, 3).toNonIndexed()
    const parts = partitionPouchGeometry(source, 'y')
    parts.structure.computeBoundingBox()

    expect(parts.structure.boundingBox!.min.z).toBeCloseTo(-1.5)
    expect(parts.structure.boundingBox!.max.z).toBeCloseTo(1.5)
    expect(parts.structure.boundingBox!.min.x).toBeCloseTo(-1)
    expect(parts.structure.boundingBox!.max.x).toBeCloseTo(1)

    Object.values(parts).forEach((geometry) => geometry.dispose())
    source.dispose()
  })

  it('preserves the supplied depth-to-height ratio instead of inflating the model', () => {
    const source = new BoxGeometry(2, 3, 0.5).toNonIndexed()
    const fitted = fitPouchGeometry(source, {
      width: 1.6,
      height: 2.4,
      thickness: 0.16,
      gussetDepth: 0.7,
    })
    fitted.computeBoundingBox()
    const positions = fitted.getAttribute('position')
    let topDepth = 0
    let bottomDepth = 0
    for (let index = 0; index < positions.count; index += 1) {
      const depth = Math.abs(positions.getZ(index)) * 2
      if (positions.getY(index) > 1) topDepth = Math.max(topDepth, depth)
      if (positions.getY(index) < -1) bottomDepth = Math.max(bottomDepth, depth)
    }

    expect(fitted.boundingBox!.max.x - fitted.boundingBox!.min.x).toBeCloseTo(1.6)
    expect(fitted.boundingBox!.max.y - fitted.boundingBox!.min.y).toBeCloseTo(2.4)
    expect(topDepth).toBeCloseTo(0.4)
    expect(bottomDepth).toBeCloseTo(0.4)

    fitted.dispose()
    source.dispose()
  })

  it('preserves authored UV coordinates while fitting model dimensions', () => {
    const source = new BoxGeometry(2, 3, 0.5).toNonIndexed()
    const sourceUvs = Array.from(source.getAttribute('uv').array)
    const fitted = fitPouchGeometry(source, {
      width: 1.6,
      height: 2.4,
      thickness: 0.16,
      gussetDepth: 0.7,
    })

    expect(Array.from(fitted.getAttribute('uv').array)).toEqual(sourceUvs)

    fitted.dispose()
    source.dispose()
  })

  it('rebuilds full-face planar UVs and mirrors the back for readable artwork', () => {
    const source = new BoxGeometry(2, 3, 0.5).toNonIndexed()
    const sourceUvs = source.getAttribute('uv')
    for (let index = 0; index < sourceUvs.count; index += 1) sourceUvs.setXY(index, 0.25, 0.75)
    sourceUvs.needsUpdate = true
    const parts = partitionPouchGeometry(source, 'z')
    const frontPositions = parts.front.getAttribute('position')
    const frontUvs = parts.front.getAttribute('uv')
    const backPositions = parts.back.getAttribute('position')
    const backUvs = parts.back.getAttribute('uv')

    for (let index = 0; index < frontPositions.count; index += 1) {
      expect(frontUvs.getX(index)).toBeCloseTo((frontPositions.getX(index) + 1) / 2)
      expect(frontUvs.getY(index)).toBeCloseTo((frontPositions.getY(index) + 1.5) / 3)
    }
    for (let index = 0; index < backPositions.count; index += 1) {
      expect(backUvs.getX(index)).toBeCloseTo(1 - (backPositions.getX(index) + 1) / 2)
      expect(backUvs.getY(index)).toBeCloseTo((backPositions.getY(index) + 1.5) / 3)
    }

    Object.values(parts).forEach((geometry) => geometry.dispose())
    source.dispose()
  })
})
