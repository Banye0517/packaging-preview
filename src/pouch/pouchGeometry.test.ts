import { describe, expect, it } from 'vitest'

import { createPouchGeometry, getPouchClosureParts } from './pouchGeometry'

describe('pouch geometry', () => {
  it('creates two printable panels, three rounded seals and one open gusset', () => {
    const parts = createPouchGeometry({
      width: 160,
      height: 240,
      thickness: 16,
      gussetDepth: 70,
      roundedCorners: true,
    })

    expect(Object.keys(parts).sort()).toEqual([
      'back',
      'front',
      'gusset',
      'leftSeal',
      'rightSeal',
      'topSeal',
    ])
    expect(parts.front.userData.printable).toBe(true)
    expect(parts.back.userData.printable).toBe(true)
    expect(parts.gusset.userData.role).toBe('open-bottom-gusset')
    expect(parts.leftSeal.userData.crossSection).toBe('rounded-bridge')
    expect(parts.rightSeal.userData.crossSection).toBe('rounded-bridge')
    expect(parts.topSeal.userData.crossSection).toBe('rounded-bridge')
    expect('bottomSeal' in parts).toBe(false)

    Object.values(parts).forEach((geometry) => geometry.dispose())
  })

  it('uses pouch thickness for front and back separation', () => {
    const thin = createPouchGeometry({
      width: 160,
      height: 240,
      thickness: 8,
      gussetDepth: 70,
      roundedCorners: true,
    })
    const thick = createPouchGeometry({
      width: 160,
      height: 240,
      thickness: 24,
      gussetDepth: 70,
      roundedCorners: true,
    })

    function middleZ(geometry: typeof thin.front) {
      const positions = geometry.getAttribute('position')
      const uvs = geometry.getAttribute('uv')
      let value = -Infinity
      for (let index = 0; index < positions.count; index += 1) {
        if (Math.abs(uvs.getX(index) - 0.5) < 0.02 &&
          Math.abs(uvs.getY(index) - 0.5) < 0.03) {
          value = Math.max(value, positions.getZ(index))
        }
      }
      return value
    }
    expect(middleZ(thick.front)).toBeGreaterThan(middleZ(thin.front))

    Object.values(thin).forEach((geometry) => geometry.dispose())
    Object.values(thick).forEach((geometry) => geometry.dispose())
  })

  it('keeps closure attachments mutually exclusive', () => {
    expect(getPouchClosureParts('none')).toEqual([])
    expect(getPouchClosureParts('zipper')).toEqual(['zipper-front', 'zipper-back'])
    expect(getPouchClosureParts('spout')).toEqual(['spout-neck', 'spout-cap'])
  })

  it('normalizes printable panel UVs for full-face artwork', () => {
    const parts = createPouchGeometry({
      width: 160,
      height: 240,
      thickness: 16,
      gussetDepth: 70,
      roundedCorners: true,
    })
    const uv = parts.front.getAttribute('uv')
    const values = Array.from({ length: uv.count }, (_, index) => [uv.getX(index), uv.getY(index)]).flat()

    expect(Math.min(...values)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...values)).toBeLessThanOrEqual(1)

    Object.values(parts).forEach((geometry) => geometry.dispose())
  })

  it('curves the panel center while keeping sealed edges at the base thickness', () => {
    const parts = createPouchGeometry({
      width: 160,
      height: 240,
      thickness: 16,
      gussetDepth: 70,
      roundedCorners: true,
    })
    const positions = parts.front.getAttribute('position')
    const uvs = parts.front.getAttribute('uv')
    let centerZ = -Infinity
    let edgeZ = Infinity
    for (let index = 0; index < positions.count; index += 1) {
      const u = uvs.getX(index)
      const v = uvs.getY(index)
      if (Math.abs(u - 0.5) < 0.12 && Math.abs(v - 0.5) < 0.18) {
        centerZ = Math.max(centerZ, positions.getZ(index))
      }
      if (u < 0.02 || u > 0.98) edgeZ = Math.min(edgeZ, positions.getZ(index))
    }

    expect(centerZ).toBeGreaterThan(edgeZ)
    Object.values(parts).forEach((geometry) => geometry.dispose())
  })

  it('uses a thin gusset surface instead of a rigid bottom block', () => {
    const parts = createPouchGeometry({
      width: 160,
      height: 240,
      thickness: 16,
      gussetDepth: 70,
      roundedCorners: true,
    })
    parts.gusset.computeBoundingBox()
    expect(parts.gusset.boundingBox!.max.y - parts.gusset.boundingBox!.min.y).toBeLessThan(0.12)
    const positions = parts.gusset.getAttribute('position')
    const centerFoldHeights: number[] = []
    for (let index = 0; index < positions.count; index += 1) {
      if (Math.abs(positions.getZ(index)) < 0.01) {
        centerFoldHeights.push(positions.getY(index))
      }
    }
    expect(centerFoldHeights.length).toBeGreaterThan(0)
    expect(Math.max(...centerFoldHeights)).toBeGreaterThan(parts.gusset.boundingBox!.min.y)
    Object.values(parts).forEach((geometry) => geometry.dispose())
  })

  it('changes the sealed outer corner contour with the rounded-corner toggle', () => {
    const square = createPouchGeometry({
      width: 160,
      height: 240,
      thickness: 16,
      gussetDepth: 70,
      roundedCorners: false,
    })
    const rounded = createPouchGeometry({
      width: 160,
      height: 240,
      thickness: 16,
      gussetDepth: 70,
      roundedCorners: true,
    })

    expect(rounded.topSeal.userData.outlineCorners).toBe('rounded')
    expect(square.topSeal.userData.outlineCorners).toBe('square')
    expect(rounded.leftSeal.userData.endInset).toBeGreaterThan(0)

    Object.values(square).forEach((geometry) => geometry.dispose())
    Object.values(rounded).forEach((geometry) => geometry.dispose())
  })
})
