import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createInitialProject, getSelectedInstance } from '../app/projectReducer'
import { InnerPackagingArtworkUploader } from './InnerPackagingArtworkUploader'

describe('InnerPackagingArtworkUploader', () => {
  it('allows typing a texture transform value directly', async () => {
    const user = userEvent.setup()
    const onTransformChange = vi.fn()
    const value = getSelectedInstance(createInitialProject()).innerPackaging1

    render(
      <InnerPackagingArtworkUploader
        artwork={value.artwork}
        onUpload={vi.fn()}
        onRemove={vi.fn()}
        transform={value}
        onTransformChange={onTransformChange}
        onTransformReset={vi.fn()}
      />,
    )

    const input = screen.getByRole('spinbutton', { name: '贴图缩放数值' })
    await user.clear(input)
    await user.type(input, '125')
    await user.keyboard('{Enter}')

    expect(onTransformChange).toHaveBeenLastCalledWith('artworkScale', 125)
  })
})
