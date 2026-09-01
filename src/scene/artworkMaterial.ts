import {
  FrontSide,
  MeshBasicMaterial,
  type Side,
  type Texture,
} from 'three'

export function createArtworkMaterial(
  texture: Texture | null,
  side: Side = FrontSide,
) {
  return new MeshBasicMaterial({
    color: '#ffffff',
    map: texture,
    side,
    toneMapped: false,
  })
}
