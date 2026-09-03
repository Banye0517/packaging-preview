import { FrontSide, type Side, type Texture } from 'three'

export function ArtworkMaterial({
  texture,
  attach,
  side = FrontSide,
  roughness = 0.68,
  clearcoat = 0.12,
}: {
  texture: Texture | null
  attach?: string
  side?: Side
  roughness?: number
  clearcoat?: number
}) {
  return (
    <meshPhysicalMaterial
      attach={attach}
      map={texture}
      color="#ffffff"
      roughness={roughness}
      metalness={0}
      clearcoat={clearcoat}
      clearcoatRoughness={0.58}
      side={side}
      toneMapped={false}
    />
  )
}
