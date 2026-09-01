import { DoubleSide, MeshBasicMaterial, Texture } from 'three'
import { describe, expect, it } from 'vitest'

import { createArtworkMaterial } from './artworkMaterial'

describe('direct-color artwork material', () => {
  it('renders an sRGB artwork map without lighting or tone mapping', () => {
    const texture = new Texture()
    const material = createArtworkMaterial(texture, DoubleSide)

    expect(material).toBeInstanceOf(MeshBasicMaterial)
    expect(material.color.getHexString()).toBe('ffffff')
    expect(material.map).toBe(texture)
    expect(material.toneMapped).toBe(false)
    expect(material.side).toBe(DoubleSide)
  })
})
