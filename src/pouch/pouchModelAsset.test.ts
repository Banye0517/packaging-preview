import { describe, expect, it } from 'vitest'

import modelSource from '../../public/models/wing-root-pouch.gltf?raw'

describe('stand-up pouch model asset', () => {
  it('ships the supplied Cinema 4D pouch as one self-contained mesh', () => {
    const model = JSON.parse(modelSource)

    expect(model.asset.generator).toContain('Cinema 4D')
    expect(model.meshes).toHaveLength(1)
    expect(model.meshes[0].primitives).toHaveLength(1)
    expect(model.meshes[0].primitives[0].attributes).toMatchObject({
      POSITION: expect.any(Number),
      NORMAL: expect.any(Number),
      TEXCOORD_0: expect.any(Number),
    })
    expect(model.buffers[0].uri).toMatch(/^data:application\/octet-stream;base64,/)
  })
})
