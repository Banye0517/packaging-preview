import { describe, expect, it } from 'vitest'

import { BackSide, Box3, Group, Mesh, Vector3 } from 'three'

import {
  calculateHangingTissuePlacement,
  HANGING_TISSUE_BODY_ROOT_NAME,
  HANGING_TISSUE_MODEL_URL,
  HANGING_TISSUE_PRINTABLE_MESH_NAMES,
  HANGING_TISSUE_PRINT_SIDE,
  HANGING_TISSUE_PULLED_SHEET_NAME,
  findModelNode,
  isPrintableBodyMesh,
} from './hangingTissueModel'

describe('PrintedHangingTissue', () => {
  it('uses the supplied hanging tissue model asset', () => {
    expect(HANGING_TISSUE_MODEL_URL).toBe('/models/hanging-tissue.gltf')
    expect(HANGING_TISSUE_BODY_ROOT_NAME).toBe('悬挂抽纸155')
    expect(HANGING_TISSUE_PULLED_SHEET_NAME).toBe('纸.1')
    expect(HANGING_TISSUE_PRINTABLE_MESH_NAMES).toEqual(['悬挂抽纸155'])
    expect(HANGING_TISSUE_PRINT_SIDE).toBe(BackSide)
  })

  it('centers the model horizontally and moves its minimum y to the local origin', () => {
    const placement = calculateHangingTissuePlacement(
      new Box3(new Vector3(-8, 0.1, -4), new Vector3(8, 39, 4)),
    )

    expect(placement.modelOffset.x).toBeCloseTo(0)
    expect(placement.modelOffset.y).toBeCloseTo(-0.1)
    expect(placement.modelOffset.z).toBeCloseTo(0)
    expect(placement.size.y).toBeCloseTo(38.9)
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
