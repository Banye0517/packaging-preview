import { describe, expect, it } from 'vitest'

import { INNER_PACKAGING_2_MODEL_URL } from './PrintedInnerPackaging2'

describe('PrintedInnerPackaging2', () => {
  it('uses the dedicated supplied model asset', () => {
    expect(INNER_PACKAGING_2_MODEL_URL).toBe('/models/inner-packaging-2.gltf')
  })
})
