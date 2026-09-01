import { BufferGeometry, Float32BufferAttribute } from 'three'
import { describe, expect, it } from 'vitest'

import { deformHangingTissueGeometry } from './hangingTissueDeformation'

function createFixture() {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([
    0.5, 0, 0.5,
    1, 1, 1,
    1, 2, 1,
    1, 3, 1,
    0.5, 4, 0.5,
    0.5, 5, 0.5,
  ], 3))
  return geometry
}

describe('hanging tissue body deformation', () => {
  it('resizes the body while preserving bottom and handle dimensions', () => {
    const source = createFixture()
    const result = deformHangingTissueGeometry(source, {
      bodyMinY: 1,
      bodyMaxY: 3,
      connectorMaxY: 4,
      widthScale: 1.5,
      heightScale: 0.75,
      depthScale: 0.6,
    })
    const position = result.getAttribute('position')

    expect(position.getX(0)).toBeCloseTo(0.5)
    expect(position.getY(0)).toBeCloseTo(0)
    expect(position.getX(1)).toBeCloseTo(1.5)
    expect(position.getZ(1)).toBeCloseTo(0.6)
    expect(position.getY(3)).toBeCloseTo(2.5)
    expect(position.getX(4)).toBeCloseTo(0.5)
    expect(position.getZ(4)).toBeCloseTo(0.5)
    expect(position.getY(4)).toBeCloseTo(3.5)
    expect(position.getY(5) - position.getY(4)).toBeCloseTo(1)
  })

  it('never mutates the source geometry', () => {
    const source = createFixture()

    deformHangingTissueGeometry(source, {
      bodyMinY: 1,
      bodyMaxY: 3,
      connectorMaxY: 4,
      widthScale: 2,
      heightScale: 2,
      depthScale: 2,
    })

    expect(source.getAttribute('position').getX(1)).toBe(1)
    expect(source.getAttribute('position').getY(5)).toBe(5)
  })

  it('rounds only the middle-body cross-section and fades before the handle', () => {
    const source = new BufferGeometry()
    source.setAttribute('position', new Float32BufferAttribute([
      1, 2, 1,
      1, 3.5, 1,
      1, 4, 1,
    ], 3))

    const result = deformHangingTissueGeometry(source, {
      bodyMinY: 1,
      bodyMaxY: 3,
      connectorMaxY: 4,
      widthScale: 1,
      heightScale: 1,
      depthScale: 1,
      radius: 20,
      bodyWidth: 160,
      bodyDepth: 80,
      bodyCenterX: 0,
      bodyCenterZ: 0,
      bodyHalfWidth: 1,
      bodyHalfDepth: 1,
    })
    const position = result.getAttribute('position')

    expect(position.getX(0)).toBeLessThan(1)
    expect(position.getZ(0)).toBeLessThan(1)
    expect(position.getX(1)).toBeGreaterThan(position.getX(0))
    expect(position.getZ(1)).toBeGreaterThan(position.getZ(0))
    expect(position.getX(2)).toBeCloseTo(1)
    expect(position.getZ(2)).toBeCloseTo(1)
  })

  it('keeps front and side centers fixed while rounding inward at corners', () => {
    const source = new BufferGeometry()
    source.setAttribute('position', new Float32BufferAttribute([
      0, 2, 1,
      1, 2, 0,
      1, 2, 1,
    ], 3))

    const result = deformHangingTissueGeometry(source, {
      bodyMinY: 1, bodyMaxY: 3, connectorMaxY: 4,
      widthScale: 1, heightScale: 1, depthScale: 1,
      radius: 20,
      bodyWidth: 160,
      bodyDepth: 80,
      bodyCenterX: 0,
      bodyCenterZ: 0,
      bodyHalfWidth: 1,
      bodyHalfDepth: 1,
    })
    const position = result.getAttribute('position')

    expect(position.getX(0)).toBeCloseTo(0)
    expect(position.getZ(0)).toBeCloseTo(1)
    expect(position.getX(1)).toBeCloseTo(1)
    expect(position.getZ(1)).toBeCloseTo(0)
    expect(Math.abs(position.getX(2))).toBeLessThanOrEqual(1)
    expect(Math.abs(position.getZ(2))).toBeLessThanOrEqual(1)
  })

  it('lets front artwork own the full corner while side artwork starts at its tangent', () => {
    const source = new BufferGeometry()
    source.setAttribute('position', new Float32BufferAttribute([
      1, 2, 1,
    ], 3))
    const shared = {
      bodyMinY: 1, bodyMaxY: 3, connectorMaxY: 4,
      widthScale: 1, heightScale: 1, depthScale: 1,
      radius: 20,
      bodyWidth: 160,
      bodyDepth: 80,
      bodyCenterX: 0,
      bodyCenterZ: 0,
      bodyHalfWidth: 1,
      bodyHalfDepth: 1,
    }

    const front = deformHangingTissueGeometry(source, { ...shared, surfaceFace: 'front' })
    const side = deformHangingTissueGeometry(source, { ...shared, surfaceFace: 'right' })
    const frontPosition = front.getAttribute('position')
    const sidePosition = side.getAttribute('position')

    expect(frontPosition.getX(0)).toBeCloseTo(1)
    expect(frontPosition.getZ(0)).toBeCloseTo(0.5)
    expect(sidePosition.getX(0)).toBeCloseTo(frontPosition.getX(0))
    expect(sidePosition.getZ(0)).toBeCloseTo(frontPosition.getZ(0))
  })

  it('projects rounded front and side centers onto exact face planes', () => {
    const source = new BufferGeometry()
    source.setAttribute('position', new Float32BufferAttribute([
      0, 2, 0.9,
      0.9, 2, 0,
    ], 3))
    const shared = {
      bodyMinY: 1, bodyMaxY: 3, connectorMaxY: 4,
      widthScale: 1, heightScale: 1, depthScale: 1,
      radius: 20,
      bodyWidth: 160,
      bodyDepth: 80,
      bodyCenterX: 0,
      bodyCenterZ: 0,
      bodyHalfWidth: 1,
      bodyHalfDepth: 1,
    }

    const front = deformHangingTissueGeometry(source, { ...shared, surfaceFace: 'front' })
    const side = deformHangingTissueGeometry(source, { ...shared, surfaceFace: 'right' })

    expect(front.getAttribute('position').getZ(0)).toBeCloseTo(1)
    expect(side.getAttribute('position').getX(1)).toBeCloseTo(1)
  })

  it('keeps radius zero identical to the existing resize result', () => {
    const source = createFixture()
    const existing = deformHangingTissueGeometry(source, {
      bodyMinY: 1, bodyMaxY: 3, connectorMaxY: 4,
      widthScale: 1.5, heightScale: 0.75, depthScale: 0.6,
    })
    const radiusZero = deformHangingTissueGeometry(source, {
      bodyMinY: 1, bodyMaxY: 3, connectorMaxY: 4,
      widthScale: 1.5, heightScale: 0.75, depthScale: 0.6,
      radius: 0,
      bodyWidth: 160,
      bodyDepth: 80,
      bodyCenterX: 0,
      bodyCenterZ: 0,
      bodyHalfWidth: 1,
      bodyHalfDepth: 1,
    })

    expect(Array.from(radiusZero.getAttribute('position').array)).toEqual(
      Array.from(existing.getAttribute('position').array),
    )
  })
})
