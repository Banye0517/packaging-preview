import { describe, expect, it } from 'vitest'

import modelSource from '../../public/models/hanging-tissue.gltf?raw'

describe('hanging tissue model asset', () => {
  it('contains the corrected body hierarchy, printable UVs, and independent pulled sheet', () => {
    const model = JSON.parse(modelSource)

    expect(model.nodes.map((node: { name?: string }) => node.name)).toEqual(expect.arrayContaining([
      '悬挂抽纸155',
      '悬挂抽纸155-材质.2',
      '悬挂抽纸155-悬挂纸巾',
      '纸.1',
    ]))
    expect(model.scenes[0].nodes).toEqual([0, 3])
    expect(model.nodes.some((node: { name?: string }) => node.name === '悬挂抽纸开')).toBe(false)

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
