import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createDefaultFaceTissue } from '../app/projectReducer'
import { FaceTissueArtworkUploader } from './FaceTissueArtworkUploader'

describe('FaceTissueArtworkUploader', () => {
  it('shows one upload input and keeps advanced transforms open', () => {
    render(
      <FaceTissueArtworkUploader
        value={createDefaultFaceTissue()}
        defaultOpen
        onUpload={vi.fn()}
        onRemove={vi.fn()}
        onTransformChange={vi.fn()}
        onTransformReset={vi.fn()}
      />,
    )

    expect(screen.getByText('面纸图稿（完整 UV）')).toBeInTheDocument()
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
    expect(screen.getByLabelText('上传面纸图稿（完整 UV）印刷图')).toBeInTheDocument()
    expect(screen.getByText('高级调整').closest('details')).toHaveAttribute('open')
  })
})
