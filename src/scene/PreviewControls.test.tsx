import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PreviewControls } from './PreviewControls'

describe('PreviewControls', () => {
  it('emits all three camera commands', async () => {
    const user = userEvent.setup()
    const onCommand = vi.fn()
    render(<PreviewControls onCommand={onCommand} />)

    await user.click(screen.getByRole('button', { name: '适合视图' }))
    await user.click(screen.getByRole('button', { name: '正视图' }))
    await user.click(screen.getByRole('button', { name: '重置相机' }))

    expect(onCommand.mock.calls).toEqual([["fit"], ["front"], ["reset"]])
  })
})
