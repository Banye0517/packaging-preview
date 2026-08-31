import type { BoxFace } from '../app/types'

// Three.js BoxGeometry groups: +X, -X, +Y, -Y, +Z, -Z.
export const BOX_MATERIAL_FACE_ORDER: readonly BoxFace[] = [
  'right',
  'left',
  'top',
  'bottom',
  'front',
  'back',
]

export const DEFAULT_BOX_ROTATION: [number, number, number] = [0, 0, 0]
