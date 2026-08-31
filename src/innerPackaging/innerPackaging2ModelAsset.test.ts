import { describe, expect, it } from 'vitest'

import modelSource from '../../public/models/inner-packaging-2.gltf?raw'

describe('inner packaging 2 model asset', () => {
  it('contains one authored mesh with normals and UVs spanning both atlas halves', () => {
    const model = JSON.parse(modelSource)
    expect(model.meshes).toHaveLength(1)
    expect(model.meshes[0].name).toBe('翅中')
    expect(model.meshes[0].primitives).toHaveLength(1)
    expect(model.meshes[0].primitives[0].attributes).toMatchObject({
      POSITION: expect.any(Number),
      NORMAL: expect.any(Number),
      TEXCOORD_0: expect.any(Number),
    })

    const uvAccessor = model.accessors[model.meshes[0].primitives[0].attributes.TEXCOORD_0]
    expect(uvAccessor.min[0]).toBeGreaterThanOrEqual(0)
    expect(uvAccessor.min[0]).toBeLessThan(0.5)
    expect(uvAccessor.max[0]).toBeGreaterThan(0.5)
    expect(uvAccessor.max[0]).toBeLessThanOrEqual(1)
    expect(uvAccessor.min[1]).toBeGreaterThanOrEqual(0)
    expect(uvAccessor.max[1]).toBeLessThanOrEqual(1)
  })
})
