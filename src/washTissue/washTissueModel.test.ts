import { describe, expect, it } from 'vitest'
import { BufferGeometry, Float32BufferAttribute, Mesh, Object3D } from 'three'
import modelUrl from '../../public/models/wash-tissue.glb?url'

import {
  WASH_TISSUE_BODY_MESH_NAME,
  WASH_TISSUE_BODY_ROOT_NAME,
  WASH_TISSUE_MODEL_URL,
  WASH_TISSUE_TOP_PLANE_NAME,
  WASH_TISSUE_TOP_SHEET_NAME,
  findWashTissueMesh,
  findWashTissueNode,
  isWashTissueMesh,
} from './washTissueModel'

describe('wash tissue model asset', () => {
  it('uses the supplied root and keeps body, plane, and pulled paper responsibilities', () => {
    expect(WASH_TISSUE_MODEL_URL).toBe('/models/wash-tissue.glb')
    expect(WASH_TISSUE_BODY_ROOT_NAME).toBe('洗脸巾1开')
    expect(WASH_TISSUE_BODY_MESH_NAME).toBe('洗脸巾')
    expect(WASH_TISSUE_TOP_PLANE_NAME).toBe('平面')
    expect(WASH_TISSUE_TOP_SHEET_NAME).toBe('纸')
    expect(modelUrl).toContain('wash-tissue.glb')
  })

  it('finds named nodes and only accepts position-plus-UV meshes', () => {
    const root = new Object3D()
    const plane = new Object3D()
    plane.name = WASH_TISSUE_TOP_PLANE_NAME
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0], 3))
    geometry.setAttribute('uv', new Float32BufferAttribute([0, 0], 2))
    const mesh = new Mesh(geometry)
    mesh.name = WASH_TISSUE_BODY_MESH_NAME
    root.add(plane, mesh)

    expect(findWashTissueNode(root, WASH_TISSUE_TOP_PLANE_NAME)).toBe(plane)
    expect(findWashTissueMesh(root, WASH_TISSUE_BODY_MESH_NAME)).toBe(mesh)
    expect(isWashTissueMesh(new Object3D())).toBe(false)
  })
})
