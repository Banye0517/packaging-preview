import { describe, expect, it } from 'vitest'

import { HANGING_TISSUE_MODEL_URL } from './PrintedHangingTissue'

describe('PrintedHangingTissue', () => {
  it('uses the supplied hanging tissue model asset', () => {
    expect(HANGING_TISSUE_MODEL_URL).toBe('/models/hanging-tissue.gltf')
  })
})
