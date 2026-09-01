import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createDefaultHangingTissue } from '../app/projectReducer'
import { HangingTissuePanel } from './HangingTissuePanel'

describe('HangingTissuePanel', () => {
  it('edits width, height, and depth as independent body dimensions', () => {
    const onChange = vi.fn()
    render(
      <HangingTissuePanel
        value={createDefaultHangingTissue()}
        onChange={onChange}
        onRotationChange={vi.fn()}
        onPulledSheetChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('盒身宽度（毫米）')).toHaveValue(160)
    expect(screen.getByLabelText('盒身高度（毫米）')).toHaveValue(205)
    expect(screen.getByLabelText('盒身厚度（毫米）')).toHaveValue(80)

    fireEvent.change(screen.getByLabelText('盒身厚度（毫米）'), {
      target: { value: '96' },
    })
    expect(onChange).toHaveBeenCalledWith('depth', 96)
  })
})
