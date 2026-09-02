import { describe, expect, it } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three'

import {
  WET_TISSUE_BODY_MESH_NAME,
  WET_TISSUE_CLOSED_ROOT_NAME,
  WET_TISSUE_LID_ART_MESH_NAME,
  WET_TISSUE_MODEL_URL,
  WET_TISSUE_OPEN_ROOT_NAME,
  WET_TISSUE_PAPER_MESH_NAME,
  findWetTissueMesh,
  findWetTissueNode,
} from './wetTissueModel'

describe('wet tissue model contract', () => {
  it('uses one supplied asset and selects the authored open/closed roots', () => {
    expect(WET_TISSUE_MODEL_URL).toBe('/models/wet-tissue.gltf')
    expect(WET_TISSUE_OPEN_ROOT_NAME).toBe('湿巾纸开')
    expect(WET_TISSUE_CLOSED_ROOT_NAME).toBe('湿巾纸')
    expect(WET_TISSUE_BODY_MESH_NAME).toBe('袋子')
    expect(WET_TISSUE_LID_ART_MESH_NAME).toBe('1')
    expect(WET_TISSUE_PAPER_MESH_NAME).toBe('纸.1')
  })

  it('finds the exact printable meshes without confusing groups and duplicate names', () => {
    const root = new Group()
    root.name = WET_TISSUE_OPEN_ROOT_NAME
    root.add(new Group())
    const body = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial())
    body.name = '袋子'
    const lid = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial())
    lid.name = '1_1'
    const paper = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial())
    paper.name = '纸1'
    root.add(body, lid, paper)

    expect(findWetTissueNode(root, WET_TISSUE_OPEN_ROOT_NAME)).toBe(root)
    expect(findWetTissueNode(root, WET_TISSUE_CLOSED_ROOT_NAME)).toBeUndefined()
    expect(findWetTissueMesh(root, WET_TISSUE_BODY_MESH_NAME)).toBe(body)
    expect(findWetTissueMesh(root, WET_TISSUE_LID_ART_MESH_NAME)).toBe(lid)
    expect(findWetTissueMesh(root, WET_TISSUE_PAPER_MESH_NAME)).toBe(paper)
  })
})
