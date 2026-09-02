import type { Mesh, Object3D } from 'three'

export const WASH_TISSUE_MODEL_URL = '/models/wash-tissue.gltf'
export const WASH_TISSUE_BODY_ROOT_NAME = '洗脸巾1开'
export const WASH_TISSUE_BODY_MESH_NAME = '洗脸巾'
export const WASH_TISSUE_TOP_PLANE_NAME = '平面'
export const WASH_TISSUE_TOP_SHEET_NAME = '纸'

export function findWashTissueNode(root: Object3D, name: string) {
  let match: Object3D | undefined
  root.traverse((node) => {
    if (!match && node.name === name) match = node
  })
  return match
}

export function isWashTissueMesh(value: Object3D | undefined): value is Mesh {
  const mesh = value as (Mesh & { isMesh?: boolean }) | undefined
  return Boolean(mesh && mesh.isMesh && mesh.geometry?.getAttribute('position') && mesh.geometry?.getAttribute('uv'))
}

export function findWashTissueMesh(root: Object3D, name: string) {
  let match: Mesh | undefined
  root.traverse((node) => {
    if (!match && isWashTissueMesh(node) && node.name === name) match = node
  })
  return match
}
