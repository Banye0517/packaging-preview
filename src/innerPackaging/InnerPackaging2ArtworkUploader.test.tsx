import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createInitialProject } from '../app/projectReducer'
import { InnerPackaging2ArtworkUploader } from './InnerPackaging2ArtworkUploader'

describe('InnerPackaging2ArtworkUploader', () => {
  it('shows two face uploads and edits only the selected face transform', async () => {
    const user = userEvent.setup()
    const value = createInitialProject().innerPackaging2
    const onSelectFace = vi.fn()
    const onTransformChange = vi.fn()
    const onTransformReset = vi.fn()

    render(
      <InnerPackaging2ArtworkUploader
        value={value}
        errors={{}}
        onUpload={vi.fn()}
        onRemove={vi.fn()}
        onSelectFace={onSelectFace}
        onTransformChange={onTransformChange}
        onTransformReset={onTransformReset}
      />,
    )

    expect(screen.getAllByLabelText(/上传(正面|背面)印刷图/)).toHaveLength(2)
    const disclosure = screen.getByText('高级调整').closest('details')
    expect(disclosure).not.toHaveAttribute('open')
    expect(screen.getByRole('slider', { name: '水平拉伸' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '垂直拉伸' })).toBeInTheDocument()

    await user.click(screen.getByText('背面'))
    expect(onSelectFace).toHaveBeenCalledWith('back')

    fireEvent.change(screen.getByRole('slider', { name: '贴图旋转' }), {
      target: { value: '35' },
    })
    expect(onTransformChange).toHaveBeenCalledWith('front', 'rotation', 35)

    fireEvent.change(screen.getByRole('slider', { name: '水平拉伸' }), {
      target: { value: '125' },
    })
    expect(onTransformChange).toHaveBeenCalledWith('front', 'stretchX', 125)

    await user.click(screen.getByRole('button', { name: '重置正面贴图' }))
    expect(onTransformReset).toHaveBeenCalledWith('front')
  })
})
