import { RoundedBox } from '@react-three/drei'

import type { PedestalBlock } from './pedestalLayout'
import { getSafePedestalRadius } from './pedestalRadius'

interface RoundedPedestalBlockProps {
  block: PedestalBlock
  color: string
  cornerRadiusMm: number
}

export function RoundedPedestalBlock({ block, color, cornerRadiusMm }: RoundedPedestalBlockProps) {
  const effectiveRadiusMm = block.sharp ? Math.min(cornerRadiusMm, 1.2) : cornerRadiusMm
  const radius = getSafePedestalRadius(effectiveRadiusMm, block.width, block.height, block.depth)
  const rotation: [number, number, number] = [0, block.rotationY ?? 0, 0]
  const material = (
    <meshPhysicalMaterial
      color={color}
      metalness={0}
      roughness={block.role === 'plinth' ? 0.78 : 0.68}
      clearcoat={block.role === 'plinth' ? 0.02 : 0.06}
      clearcoatRoughness={0.55}
      envMapIntensity={0.35}
    />
  )

  if (radius === 0) {
    return (
      <mesh
        name={`pedestal-block-${block.id}`}
        position={block.center}
        rotation={rotation}
        castShadow={block.role !== 'plinth'}
        receiveShadow
      >
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
      rotation={rotation}
      radius={radius}
      smoothness={4}
      bevelSegments={3}
      castShadow={block.role !== 'plinth'}
      receiveShadow
    >
      {material}
    </RoundedBox>
  )
}
