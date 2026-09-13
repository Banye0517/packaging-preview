import type { PedestalColor } from '../app/types'

import type { PedestalBlock } from './pedestalLayout'
import { PEDESTAL_COLORS } from './pedestalColors'
import { RoundedPedestalBlock } from './RoundedPedestalBlock'

interface PedestalStageProps {
  blocks: PedestalBlock[]
  color: PedestalColor
  cornerRadiusMm: number
}

export function PedestalStage({ blocks, color, cornerRadiusMm }: PedestalStageProps) {
  const materialColor = PEDESTAL_COLORS[color]

  return (
    <group name="pedestal-stage">
      {blocks.map((block) => (
        <RoundedPedestalBlock
          key={block.id}
          block={block}
          color={materialColor}
          cornerRadiusMm={cornerRadiusMm}
        />
      ))}
    </group>
  )
}
