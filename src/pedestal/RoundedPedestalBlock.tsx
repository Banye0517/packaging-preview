import { RoundedBox } from '@react-three/drei'

import type { PedestalBlock } from './pedestalLayout'
import { getSafePedestalRadius } from './pedestalRadius'

interface RoundedPedestalBlockProps {
  block: PedestalBlock
  color: string
  cornerRadiusMm: number
}

export function RoundedPedestalBlock({ block, color, cornerRadiusMm }: RoundedPedestalBlockProps) {
  const radius = getSafePedestalRadius(cornerRadiusMm, block.width, block.height, block.depth)
  const material = (
    <meshPhysicalMaterial color={color} metalness={0} roughness={0.82} clearcoat={0.04} />
  )

  if (radius === 0) {
    return (
      <mesh name={`pedestal-block-${block.id}`} position={block.center} castShadow receiveShadow>
        <boxGeometry args={[block.width, block.height, block.depth]} />
        {material}
      </mesh>
    )
  }

  return (
    <RoundedBox
      name={`pedestal-block-${block.id}`}
      args={[block.width, block.height, block.depth]}
      position={block.center}
      radius={radius}
      smoothness={4}
      bevelSegments={4}
      castShadow
      receiveShadow
    >
      {material}
    </RoundedBox>
  )
}
