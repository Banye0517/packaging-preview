import { FrontSide, type Side, type Texture } from 'three'

export function ArtworkMaterial({
  texture,
  attach,
  side = FrontSide,
  roughness = 0.56,
  clearcoat = 0.06,
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
      clearcoatRoughness={0.54}
      envMapIntensity={0.45}
      side={side}
    />
  )
}
