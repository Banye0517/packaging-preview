import { BufferGeometry, Float32BufferAttribute } from 'three'
import { describe, expect, it } from 'vitest'

import {
  calculateTopSheetAnchor,
  deformFaceTissueGeometry,
  type FaceTissueSourceBounds,
} from './faceTissueDeformation'

function createFixture() {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([
    -2, 0, -1,
    2, 0, 1,
    2, 4, 1,
  ], 3))
  geometry.setAttribute('uv', new Float32BufferAttribute([
    0, 0,
    1, 0,
    1, 1,
  ], 2))
  return geometry
}

const sourceBounds: FaceTissueSourceBounds = {
  minX: -2,
  maxX: 2,
  minY: 0,
  maxY: 4,
  minZ: -1,
  maxZ: 1,
}

describe('face tissue body deformation', () => {
  it('resizes width, height, and thickness from a bottom-anchored source', () => {
    const source = createFixture()
    const result = deformFaceTissueGeometry(source, {
      sourceBounds,
      width: 8,
      height: 6,
      thickness: 4,
      radius: 0,
    })
    const position = result.getAttribute('position')

    expect(position.getX(0)).toBeCloseTo(-4)
    expect(position.getY(0)).toBeCloseTo(0)
    expect(position.getZ(0)).toBeCloseTo(-2)
    expect(position.getY(2)).toBeCloseTo(6)
    expect(result.boundingBox?.min.y).toBeCloseTo(0)
  })

  it('preserves source UVs and does not mutate source geometry', () => {
    const source = createFixture()
    const sourceUvs = Array.from(source.getAttribute('uv').array)

    const result = deformFaceTissueGeometry(source, {
      sourceBounds,
      width: 8,
      height: 6,
      thickness: 4,
      radius: 0,
    })

    expect(Array.from(result.getAttribute('uv').array)).toEqual(sourceUvs)
    expect(source.getAttribute('position').getX(0)).toBe(-2)
    expect(source.getAttribute('position').getY(2)).toBe(4)
  })

  it('moves the independent top sheet without changing its dimensions', () => {
    const anchor = calculateTopSheetAnchor(
      { minY: 0, maxY: 4 },
      { minY: 0, maxY: 6 },
    )

    expect(anchor).toEqual({ y: 2 })
  })

  it('rounds body corners while retaining the authored UVs', () => {
    const source = createFixture()
    const result = deformFaceTissueGeometry(source, {
      sourceBounds,
      width: 8,
      height: 6,
      thickness: 4,
      radius: 1,
    })
    const position = result.getAttribute('position')

    expect(position.getX(1)).toBeLessThan(4)
    expect(position.getY(2)).toBeLessThan(6)
    expect(position.getZ(1)).toBeLessThan(2)
    expect(Array.from(result.getAttribute('uv').array)).toEqual([0, 0, 1, 0, 1, 1])
  })
})
