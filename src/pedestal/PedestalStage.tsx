import type { PedestalColor } from '../app/types'

import type { PedestalBlock } from './pedestalLayout'
import { STAGE_PALETTES } from './pedestalColors'
import { RoundedPedestalBlock } from './RoundedPedestalBlock'

interface PedestalStageProps {
  blocks: PedestalBlock[]
  color: PedestalColor
  cornerRadiusMm: number
}

export function PedestalStage({ blocks, color, cornerRadiusMm }: PedestalStageProps) {
  const palette = STAGE_PALETTES[color] ?? STAGE_PALETTES.morandi

  return (
    <group name="pedestal-stage">
      {blocks.map((block, index) => {
        const blockColor = block.role === 'plinth'
          ? palette.plinth
          : palette.risers[(block.paletteIndex ?? index) % palette.risers.length]
        return (
          <RoundedPedestalBlock
            key={block.id}
            block={block}
            color={blockColor}
            cornerRadiusMm={cornerRadiusMm}
          />
        )
      })}
    </group>
  )
}
