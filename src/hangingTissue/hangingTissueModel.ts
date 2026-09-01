import { Box3, Vector3, type Mesh, type Object3D } from 'three'

export const HANGING_TISSUE_MODEL_URL = '/models/hanging-tissue.gltf'
export const HANGING_TISSUE_BODY_ROOT_NAME = '悬挂抽纸155'
export const HANGING_TISSUE_PULLED_SHEET_NAME = '纸.1'

export function calculateHangingTissuePlacement(bounds: Box3) {
  const size = bounds.getSize(new Vector3())
  const center = bounds.getCenter(new Vector3())
  return {
    size,
    modelOffset: new Vector3(-center.x, -bounds.min.y, -center.z),
  }
}

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
