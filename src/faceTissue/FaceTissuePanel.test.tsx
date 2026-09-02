import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createDefaultFaceTissue } from '../app/projectReducer'
import { FaceTissuePanel } from './FaceTissuePanel'

describe('FaceTissuePanel', () => {
  it('shows dimensions, model direction, and a visible top-sheet switch', () => {
    render(
      <FaceTissuePanel
        value={createDefaultFaceTissue()}
        onChange={vi.fn()}
        onRotationChange={vi.fn()}
        onTopSheetChange={vi.fn()}
      />,
    )

    expect(screen.getByText('面纸设置')).toBeInTheDocument()
    expect(screen.getByText('盒身厚度（毫米）')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '顶部抽纸' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '0°' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '90°' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '180°' })).toBeInTheDocument()
  })
})
