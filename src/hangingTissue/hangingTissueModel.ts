import { type Mesh, type Object3D } from 'three'

export const HANGING_TISSUE_MODEL_URL = '/models/hanging-tissue.gltf'

export function isPrintableBodyMesh(value: unknown): value is Mesh {
  return !!value && typeof value === 'object' &&
    (value as { isMesh?: unknown }).isMesh === true
}

export function findModelNode(root: Object3D, sourceName: string) {
  const normalizedName = sourceName.replaceAll('.', '')
  let match: Object3D | undefined
  root.traverse((node) => {
    if (!match && node.name === normalizedName) match = node
  })
  return match
}
