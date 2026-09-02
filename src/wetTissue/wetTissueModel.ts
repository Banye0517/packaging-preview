import type { Mesh, Object3D } from 'three'

export const WET_TISSUE_MODEL_URL = '/models/wet-tissue.gltf'
export const WET_TISSUE_OPEN_ROOT_NAME = '湿巾纸开'
export const WET_TISSUE_CLOSED_ROOT_NAME = '湿巾纸'
export const WET_TISSUE_BODY_MESH_NAME = '袋子'
export const WET_TISSUE_LID_ART_MESH_NAME = '1'
export const WET_TISSUE_PAPER_MESH_NAME = '纸.1'

export function findWetTissueNode(root: Object3D, name: string) {
  let match: Object3D | undefined
  root.traverse((node) => {
    if (!match && node.name === name) match = node
  })
  return match
}

export function isWetTissueMesh(value: Object3D | undefined): value is Mesh {
  const mesh = value as (Mesh & { isMesh?: boolean }) | undefined
  return Boolean(mesh?.isMesh && mesh.geometry?.getAttribute('position') && mesh.geometry?.getAttribute('uv'))
}

export function findWetTissueMesh(root: Object3D, name: string) {
  const normalizedName = name.replace(/[._]/g, '')
  let match: Mesh | undefined
  root.traverse((node) => {
    if (match || !isWetTissueMesh(node)) return
    const normalizedNodeName = node.name.replace(/[._]/g, '')
    const duplicateName = new RegExp(`^${name.replace(/[._]/g, '')}_?\\d+$`).test(node.name.replace(/[._]/g, ''))
    if (node.name === name || normalizedNodeName === normalizedName || duplicateName) match = node
  })
  return match
}
