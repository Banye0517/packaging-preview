import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createDefaultWetTissue } from '../app/projectReducer'
import { WetTissuePanel } from './WetTissuePanel'

describe('WetTissuePanel', () => {
  it('shows dimensions, open/closed state, paper visibility, and model direction', () => {
    render(
      <WetTissuePanel
        value={createDefaultWetTissue()}
        onChange={vi.fn()}
        onRotationChange={vi.fn()}
        onModelStateChange={vi.fn()}
        onTopSheetChange={vi.fn()}
      />,
    )

    expect(screen.getByText('湿纸巾设置')).toBeInTheDocument()
    expect(screen.getByText('盒身厚度（毫米）')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '打开' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '关闭' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '顶部纸张' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '0°' })).toBeChecked()
  })
})
