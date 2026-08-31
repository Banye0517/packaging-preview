import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PouchArtworkGrid } from './PouchArtworkGrid'

describe('PouchArtworkGrid', () => {
  it('renders exactly front and back uploads', () => {
    render(
      <PouchArtworkGrid
        faces={{ front: null, back: null }}
        errors={{}}
        onUpload={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(2)
    expect(screen.getByLabelText('上传正面印刷图')).toBeInTheDocument()
    expect(screen.getByLabelText('上传背面印刷图')).toBeInTheDocument()
    expect(screen.queryByLabelText('上传左侧印刷图')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('上传底部印刷图')).not.toBeInTheDocument()
  })
})
