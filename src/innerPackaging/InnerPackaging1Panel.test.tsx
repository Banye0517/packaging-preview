import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createInitialProject } from '../app/projectReducer'
import { InnerPackaging1Panel } from './InnerPackaging1Panel'

describe('InnerPackaging1Panel', () => {
  it('offers 0, 90 and 180 degree model directions', async () => {
    const user = userEvent.setup()
    const onRotationChange = vi.fn()

    render(
      <InnerPackaging1Panel
        value={createInitialProject().innerPackaging1}
        onChange={vi.fn()}
        onRotationChange={onRotationChange}
      />,
    )

    expect(screen.getAllByRole('radio', { name: /°/ })).toHaveLength(3)
    await user.click(screen.getByRole('radio', { name: '90°' }))
    expect(onRotationChange).toHaveBeenCalledWith(90)
  })

  it('supports inner packaging 2 title without changing the default copy', () => {
    const value = createInitialProject().innerPackaging1
    const { rerender } = render(
      <InnerPackaging1Panel
        value={value}
        onChange={vi.fn()}
        onRotationChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: '内包装1设置' })).toBeInTheDocument()

    rerender(
      <InnerPackaging1Panel
        value={value}
        title="内包装2设置"
        onChange={vi.fn()}
        onRotationChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: '内包装2设置' })).toBeInTheDocument()
  })
})
