import { describe, expect, it } from 'vitest'
import { BufferGeometry, Float32BufferAttribute, Mesh, Object3D } from 'three'
import modelSource from '../../public/models/face-tissue.gltf?raw'

import {
  FACE_TISSUE_MODEL_URL,
  FACE_TISSUE_PRINTABLE_MESH_NAME,
  FACE_TISSUE_SIDE_MESH_NAME,
  FACE_TISSUE_TOP_SHEET_NAME,
  findFaceTissueMesh,
  isFaceTissueMesh,
} from './faceTissueModel'

describe('face tissue model asset', () => {
  it('uses the supplied model and required node responsibilities', () => {
    expect(FACE_TISSUE_MODEL_URL).toBe('/models/face-tissue.gltf')
    expect(FACE_TISSUE_PRINTABLE_MESH_NAME).toBe('Default')
    expect(FACE_TISSUE_SIDE_MESH_NAME).toBe('Default-材质.2')
    expect(FACE_TISSUE_TOP_SHEET_NAME).toBe('纸')
    expect(modelSource).toContain('TEXCOORD_0')
    expect(modelSource).toContain('面纸打开')
  })

  it('only accepts meshes with position and UV attributes', () => {
    expect(isFaceTissueMesh(new Object3D())).toBe(false)
    const mesh = new Mesh()
    expect(isFaceTissueMesh(mesh)).toBe(false)
  })

  it('finds the mesh when the asset has a same-named non-mesh group first', () => {
    const root = new Object3D()
    const group = new Object3D()
    group.name = 'Default'
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0], 3))
    geometry.setAttribute('uv', new Float32BufferAttribute([0, 0], 2))
    const mesh = new Mesh(geometry)
    mesh.name = 'Default'
    root.add(group)
    root.add(mesh)

    expect(findFaceTissueMesh(root, 'Default')).toBe(mesh)
  })

  it('accepts loader-normalized names from duplicate and punctuation-heavy nodes', () => {
    const root = new Object3D()
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0], 3))
    geometry.setAttribute('uv', new Float32BufferAttribute([0, 0], 2))
    const body = new Mesh(geometry)
    body.name = 'Default_1'
    const side = new Mesh(geometry)
    side.name = 'Default-材质2'
    root.add(body, side)

    expect(findFaceTissueMesh(root, 'Default')).toBe(body)
    expect(findFaceTissueMesh(root, 'Default-材质.2')).toBe(side)
  })
})
