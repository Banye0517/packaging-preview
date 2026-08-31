import { MeshStandardMaterial, Texture } from 'three'
import { describe, expect, it } from 'vitest'

import { applyTextureMap } from '../scene/textureMaterial'

describe('inner packaging texture material', () => {
  it('forces a material shader refresh when an async texture becomes available', () => {
    const material = new MeshStandardMaterial()
    const texture = new Texture()
    const version = material.version

    applyTextureMap(material, texture)

    expect(material.map).toBe(texture)
    expect(material.version).toBe(version + 1)

    material.dispose()
    texture.dispose()
  })
})
