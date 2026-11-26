import {
  FrontSide,
  MeshPhysicalMaterial,
  type Side,
  type Texture,
} from 'three'

export function createArtworkMaterial(
  texture: Texture | null,
  side: Side = FrontSide,
) {
  if (texture) {
    texture.anisotropy = Math.max(texture.anisotropy || 1, 16)
  }
  return new MeshPhysicalMaterial({
    color: '#ffffff',
    map: texture,
    roughness: 0.56,
    metalness: 0,
    clearcoat: 0.06,
    clearcoatRoughness: 0.54,
    envMapIntensity: 0.45,
    side,
  })
}
