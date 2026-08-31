import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createDefaultHangingTissue } from '../app/projectReducer'
import { HangingTissuePanel } from './HangingTissuePanel'

describe('HangingTissuePanel', () => {
  it('changes only the pulled-sheet visibility through its switch', async () => {
    const user = userEvent.setup()
    const onPulledSheetChange = vi.fn()
    render(
      <HangingTissuePanel
        value={createDefaultHangingTissue()}
        onChange={vi.fn()}
        onRotationChange={vi.fn()}
        onPulledSheetChange={onPulledSheetChange}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: '显示抽纸' }))

    expect(onPulledSheetChange).toHaveBeenCalledWith(false)
  })
})
