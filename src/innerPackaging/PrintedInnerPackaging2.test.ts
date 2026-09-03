import { describe, expect, it } from 'vitest'

import { INNER_PACKAGING_2_MODEL_URL } from './PrintedInnerPackaging2'
import source from './PrintedInnerPackaging2.tsx?raw'

describe('PrintedInnerPackaging2', () => {
  it('uses the dedicated supplied model asset', () => {
    expect(INNER_PACKAGING_2_MODEL_URL).toBe('/models/inner-packaging-2.gltf')
  })

  it('casts a product shadow without receiving a dense self-shadow map', () => {
    expect(source).toContain('castShadow receiveShadow={false}')
  })
})
