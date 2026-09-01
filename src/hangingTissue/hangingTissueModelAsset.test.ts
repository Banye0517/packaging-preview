import { describe, expect, it } from 'vitest'

import modelSource from '../../public/models/hanging-tissue.gltf?raw'

describe('hanging tissue model asset', () => {
  it('contains one printable body mesh and an independent pulled sheet', () => {
    const model = JSON.parse(modelSource)

    expect(model.nodes.map((node: { name?: string }) => node.name)).toEqual(expect.arrayContaining([
      '悬挂抽纸155',
      '纸.1',
    ]))
    expect(model.scenes[0].nodes).toEqual([0, 1])
    expect(model.nodes[0]).toMatchObject({ name: '悬挂抽纸155', mesh: 0 })

    const printableBody = model.meshes.find(
      (mesh: { name?: string }) => mesh.name === '悬挂抽纸155',
    )
    expect(printableBody?.primitives[0].attributes).toMatchObject({
      POSITION: expect.any(Number),
      NORMAL: expect.any(Number),
      TEXCOORD_0: expect.any(Number),
    })
    expect(model.meshes.filter((mesh: { name?: string }) => mesh.name === '悬挂抽纸155')).toHaveLength(1)
  })
})
