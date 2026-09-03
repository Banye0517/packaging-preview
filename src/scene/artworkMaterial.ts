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
  return new MeshPhysicalMaterial({
    color: '#ffffff',
    map: texture,
    roughness: 0.68,
    metalness: 0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.58,
    side,
    toneMapped: false,
  })
}
