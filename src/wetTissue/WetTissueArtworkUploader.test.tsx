import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createDefaultWetTissue } from '../app/projectReducer'
import { WetTissueArtworkUploader } from './WetTissueArtworkUploader'

describe('WetTissueArtworkUploader', () => {
  it('shows exactly two upload inputs and keeps advanced transforms collapsed', () => {
    render(
      <WetTissueArtworkUploader
        value={createDefaultWetTissue()}
        errors={{}}
        onUpload={vi.fn()}
        onRemove={vi.fn()}
        onSelectArtwork={vi.fn()}
        onTransformChange={vi.fn()}
        onTransformReset={vi.fn()}
      />,
    )

    expect(screen.getByText('纸盒贴纸（完整 UV）')).toBeInTheDocument()
    expect(screen.getByText('盖子贴纸（完整 UV）')).toBeInTheDocument()
    expect(screen.getAllByLabelText(/印刷图$/)).toHaveLength(2)
    expect(screen.getByText('高级调整').closest('details')).not.toHaveAttribute('open')
  })
})
