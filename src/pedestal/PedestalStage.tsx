import type { PedestalColor } from '../app/types'

import type { PedestalBlock } from './pedestalLayout'
import { PEDESTAL_COLORS } from './pedestalColors'

interface PedestalStageProps {
  blocks: PedestalBlock[]
  color: PedestalColor
}

export function PedestalStage({ blocks, color }: PedestalStageProps) {
  const materialColor = PEDESTAL_COLORS[color]

  return (
    <group name="pedestal-stage">
      {blocks.map((block) => (
        <mesh
          key={block.id}
          name={`pedestal-block-${block.id}`}
          position={block.center}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[block.width, block.height, block.depth]} />
          <meshPhysicalMaterial
            color={materialColor}
            metalness={0}
            roughness={0.82}
            clearcoat={0.04}
          />
        </mesh>
      ))}
    </group>
  )
}
