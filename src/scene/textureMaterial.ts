import type { MeshStandardMaterial, Texture } from 'three'

export function applyTextureMap(
  material: MeshStandardMaterial,
  texture: Texture | null,
) {
  material.map = texture
  material.needsUpdate = true
}
