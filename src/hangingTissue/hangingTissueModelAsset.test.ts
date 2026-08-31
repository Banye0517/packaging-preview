import { describe, expect, it } from 'vitest'

import modelSource from '../../public/models/hanging-tissue.gltf?raw'

describe('hanging tissue model asset', () => {
  it('contains the open hierarchy, printable body UVs, and the pulled-sheet node', () => {
    const model = JSON.parse(modelSource)

    expect(model.nodes.some((node: { name?: string }) => node.name === '悬挂抽纸开')).toBe(true)
    expect(model.nodes.some((node: { name?: string }) => node.name === '纸.1')).toBe(true)

    const printableBody = model.meshes.find(
      (mesh: { name?: string }) => mesh.name === '悬挂抽纸155-材质.2',
    )
    expect(printableBody?.primitives[0].attributes).toMatchObject({
      POSITION: expect.any(Number),
      NORMAL: expect.any(Number),
      TEXCOORD_0: expect.any(Number),
    })
  })
})
