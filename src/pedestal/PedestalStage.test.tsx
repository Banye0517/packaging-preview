import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PedestalStage } from './PedestalStage'
import { PEDESTAL_COLORS } from './pedestalColors'

describe('PedestalStage', () => {
  it('renders grounded shadow-casting blocks in the selected color', () => {
    const { container } = render(<PedestalStage blocks={[{
      id: 'stage-1',
      role: 'base',
      center: [1, 0.6, 2],
      width: 3,
      height: 1.2,
      depth: 2,
      minWidth: 1.15,
      minDepth: 1,
    }]} color="light-pink" cornerRadiusMm={0} />)

    const mesh = container.querySelector('mesh[name="pedestal-block-stage-1"]')
    expect(mesh).toBeInTheDocument()
    expect(PEDESTAL_COLORS['light-pink']).toBe('#f3dedf')
  })
})
