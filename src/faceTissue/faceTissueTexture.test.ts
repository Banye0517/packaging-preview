import { describe, expect, it } from 'vitest'

import {
  calculateFaceTissueArtworkCompensation,
  FACE_TISSUE_UV_REGIONS,
} from './faceTissueTexture'

describe('face tissue artwork compensation', () => {
  it('keeps each complete-UV panel at its uploaded physical size', () => {
    expect(calculateFaceTissueArtworkCompensation('front', {
      width: 200, height: 205, thickness: 100,
    }, {
      width: 160, height: 205, thickness: 80,
    })).toEqual({ x: 0.8, y: 1 })

    expect(calculateFaceTissueArtworkCompensation('top', {
      width: 200, height: 205, thickness: 100,
    }, {
      width: 160, height: 205, thickness: 80,
    })).toEqual({ x: 0.8, y: 0.8 })
  })

  it('defines four bounded body UV panels without side regions', () => {
    expect(FACE_TISSUE_UV_REGIONS).toHaveLength(4)
    FACE_TISSUE_UV_REGIONS.forEach((region) => {
      expect(region.minU).toBeGreaterThanOrEqual(0)
      expect(region.maxU).toBeLessThanOrEqual(1)
      expect(region.minV).toBeGreaterThanOrEqual(0)
      expect(region.maxV).toBeLessThanOrEqual(1)
    })
  })
})
