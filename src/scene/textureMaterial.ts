import type { Material, Texture } from 'three'

export function applyTextureMap(
  material: Material & { map: Texture | null },
  texture: Texture | null,
) {
  material.map = texture
  material.needsUpdate = true
}
