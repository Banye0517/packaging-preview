import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { ProjectState } from '../app/types'
import { FaceGrid } from './FaceGrid'

const emptyFaces: ProjectState['faces'] = {
  top: null,
  left: null,
  front: null,
  right: null,
  back: null,
  bottom: null,
}

describe('FaceGrid', () => {
  it('renders six explicit upload inputs', () => {
    render(
      <FaceGrid
        faces={emptyFaces}
        errors={{}}
        onUpload={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(6)
    expect(screen.getByLabelText('上传正面印刷图')).toBeInTheDocument()
    expect(screen.getByLabelText('上传背面印刷图')).toBeInTheDocument()
  })

  it('uploads only through the selected face input', async () => {
    const user = userEvent.setup()
    const onUpload = vi.fn()
    const file = new File(['front'], 'front.png', { type: 'image/png' })
    render(
      <FaceGrid
        faces={emptyFaces}
        errors={{}}
        onUpload={onUpload}
        onRemove={vi.fn()}
      />,
    )

    await user.upload(screen.getByLabelText('上传正面印刷图'), file)

    expect(onUpload).toHaveBeenCalledOnce()
    expect(onUpload).toHaveBeenCalledWith('front', file)
  })

  it('shows a face-level error without hiding other upload inputs', () => {
    render(
      <FaceGrid
        faces={emptyFaces}
        errors={{ front: '仅支持 PNG、JPG 和 WebP' }}
        onUpload={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByText('仅支持 PNG、JPG 和 WebP')).toBeInTheDocument()
    expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(6)
  })
})
