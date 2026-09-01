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

})
