import { describe, expect, it } from 'vitest'

import { Group, Mesh } from 'three'

import { HANGING_TISSUE_MODEL_URL, findModelNode, isPrintableBodyMesh } from './hangingTissueModel'

describe('PrintedHangingTissue', () => {
  it('uses the supplied hanging tissue model asset', () => {
    expect(HANGING_TISSUE_MODEL_URL).toBe('/models/hanging-tissue.gltf')
  })

  it('recognizes a printable Three.js mesh through its runtime mesh flag', () => {
    expect(isPrintableBodyMesh({ isMesh: true })).toBe(true)
    expect(isPrintableBodyMesh({ isMesh: false })).toBe(false)
  })

  it('finds GLTFLoader-normalized node names that omit dots', () => {
    const root = new Group()
    const body = new Mesh()
    body.name = '悬挂抽纸155-材质2'
    root.add(body)

    expect(findModelNode(root, '悬挂抽纸155-材质.2')).toBe(body)
  })
})
