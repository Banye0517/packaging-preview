import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createDefaultHangingTissue } from '../app/projectReducer'
import { HangingTissueArtworkUploader } from './HangingTissueArtworkUploader'

describe('HangingTissueArtworkUploader', () => {
  it('shows exactly four uploads and keeps advanced transforms collapsed', () => {
    render(
      <HangingTissueArtworkUploader
        value={createDefaultHangingTissue()}
        errors={{}}
        onUpload={vi.fn()}
        onRemove={vi.fn()}
        onSelectFace={vi.fn()}
        onTransformChange={vi.fn()}
        onTransformReset={vi.fn()}
      />,
    )

    expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(4)
    expect(screen.getByLabelText('上传正面印刷图')).toBeInTheDocument()
    expect(screen.getByLabelText('上传背面印刷图')).toBeInTheDocument()
    expect(screen.getByLabelText('上传左侧印刷图')).toBeInTheDocument()
    expect(screen.getByLabelText('上传右侧印刷图')).toBeInTheDocument()
    expect(screen.getByText('高级调整').closest('details')).not.toHaveAttribute('open')
  })
})
