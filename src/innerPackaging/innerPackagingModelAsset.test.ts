import { describe, expect, it } from 'vitest'

import modelSource from '../../public/models/inner-packaging-1.gltf?raw'

describe('inner packaging model asset', () => {
  it('contains the supplied main bag and the removable size helper', () => {
    const model = JSON.parse(modelSource) as {
      nodes?: Array<{ name?: string; mesh?: number }>
      meshes?: unknown[]
      buffers?: Array<{ uri?: string }>
    }

    expect(model.nodes?.some((node) => node.name === '青豌豆' && node.mesh === 0)).toBe(true)
    expect(model.nodes?.some((node) => node.name === '大概尺寸')).toBe(true)
    expect(model.meshes).toHaveLength(2)
    expect(
      (model.meshes?.[0] as { primitives?: Array<{ attributes?: object }> })
        .primitives?.[0].attributes,
    ).toMatchObject({ POSITION: expect.any(Number), TEXCOORD_0: expect.any(Number) })
    expect(model.buffers?.every((buffer) => buffer.uri?.startsWith('data:'))).toBe(true)
  })
})
