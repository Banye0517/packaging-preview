import { describe, expect, it } from 'vitest'
import { BoxGeometry, Vector3 } from 'three'

import {
  calculateWetTissueArtworkCompensation,
  deformWetTissueGeometry,
} from './wetTissueDeformation'

describe('wet tissue deformation', () => {
  it('scales geometry dimensions while preserving its UV attribute', () => {
    const source = new BoxGeometry(2, 4, 6)
    const uvBefore = source.getAttribute('uv').array.slice()
    const result = deformWetTissueGeometry(source, {
      sourceDimensions: { width: 2, height: 4, thickness: 6 },
      targetDimensions: { width: 4, height: 8, thickness: 3 },
    })

    result.computeBoundingBox()
    expect(result.boundingBox?.getSize(new Vector3())).toMatchObject({ x: 4, y: 8, z: 3 })
    expect(Array.from(result.getAttribute('uv').array)).toEqual(Array.from(uvBefore))
  })

  it('inverse-compensates each artwork using dimensions captured at upload', () => {
    expect(calculateWetTissueArtworkCompensation(
      { width: 160, height: 205, thickness: 80 },
      { width: 320, height: 410, thickness: 40 },
    )).toEqual({ x: 0.5, y: 0.5 })
  })
})
