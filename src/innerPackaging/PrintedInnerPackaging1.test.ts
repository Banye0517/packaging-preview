import { MeshStandardMaterial, Texture } from 'three'
import { describe, expect, it } from 'vitest'

import { applyTextureMap } from '../scene/textureMaterial'
import printedSource from './PrintedInnerPackaging1.tsx?raw'

describe('inner packaging texture material', () => {
  it('turns the supplied model horizontally and suppresses micro-surface reflections', () => {
    expect(printedSource).toContain('<group rotation={[0, Math.PI, 0]}>')
    expect(printedSource).toContain('receiveShadow={false}')
    expect(printedSource).toContain('roughness={0.92}')
    expect(printedSource).toContain('clearcoat={0}')
  })

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
