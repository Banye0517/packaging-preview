import type { Mesh, Object3D } from 'three'

export const FACE_TISSUE_MODEL_URL = '/models/face-tissue.gltf'
export const FACE_TISSUE_BODY_ROOT_NAME = '面纸打开'
export const FACE_TISSUE_PRINTABLE_MESH_NAME = 'Default'
export const FACE_TISSUE_SIDE_MESH_NAME = 'Default-材质.2'
export const FACE_TISSUE_TOP_SHEET_NAME = '纸'

export function findFaceTissueNode(root: Object3D, name: string) {
  let match: Object3D | undefined
  root.traverse((node) => {
    if (!match && node.name === name) match = node
  })
  return match
}

export function findFaceTissueMesh(root: Object3D, name: string) {
  let match: Mesh | undefined
  const normalizedName = name.replace(/[._]/g, '')
  root.traverse((node) => {
    if (match || !isFaceTissueMesh(node)) return
    const normalizedNodeName = node.name.replace(/[._]/g, '')
    const isExactMatch = node.name === name
    const isDuplicateDefault = name === FACE_TISSUE_PRINTABLE_MESH_NAME && /^Default_\d+$/.test(node.name)
    const isNormalizedMatch = normalizedNodeName === normalizedName
    if (isExactMatch || isDuplicateDefault || isNormalizedMatch) match = node
  })
  return match
}

export function isFaceTissueMesh(value: Object3D | undefined): value is Mesh {
  const mesh = value as (Mesh & { isMesh?: boolean }) | undefined
  return Boolean(
    mesh &&
    mesh.isMesh &&
    mesh.geometry?.getAttribute('position') &&
    mesh.geometry?.getAttribute('uv'),
  )
}
