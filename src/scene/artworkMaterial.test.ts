import { DoubleSide, MeshPhysicalMaterial, Texture } from 'three'
import { describe, expect, it } from 'vitest'

import { createArtworkMaterial } from './artworkMaterial'

describe('physically lit artwork material', () => {
  it('uses the artwork as a physical printed surface', () => {
    const texture = new Texture()
    const material = createArtworkMaterial(texture, DoubleSide)

    expect(material).toBeInstanceOf(MeshPhysicalMaterial)
    expect(material.color.getHexString()).toBe('ffffff')
    expect(material.map).toBe(texture)
    expect(material.toneMapped).toBe(false)
    expect(material.side).toBe(DoubleSide)
    const physical = material as MeshPhysicalMaterial
    expect(physical.emissiveMap).toBeNull()
    expect(physical.emissiveIntensity).toBe(1)
    expect(physical.roughness).toBeCloseTo(0.68)
    expect(physical.metalness).toBe(0)
    expect(material.clearcoat).toBeCloseTo(0.12)
  })
})
