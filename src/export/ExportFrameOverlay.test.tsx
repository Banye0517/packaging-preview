import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ExportFrameOverlay } from './ExportFrameOverlay'

describe('ExportFrameOverlay', () => {
  it('shows the fixed frame size and switches aspect ratios', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ExportFrameOverlay presetId="square-standard" onChange={onChange} pedestal={{ preset: 'none', color: 'warm-white', cornerRadiusMm: 8 }} onPedestalPresetChange={vi.fn()} onPedestalColorChange={vi.fn()} onPedestalRadiusChange={vi.fn()} />)

    expect(screen.getByText('PNG 导出范围 · 800 × 800')).toBeInTheDocument()
    expect(screen.getByTestId('export-frame-mask')).toHaveClass('export-frame-overlay--pass-through')

    await user.click(screen.getByRole('button', { name: '16:9' }))
    expect(onChange).toHaveBeenCalledWith('landscape-2k')

    await user.click(screen.getByRole('button', { name: '9:16' }))
    expect(onChange).toHaveBeenCalledWith('portrait-2k')
  })

  it('offers both square resolutions', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ExportFrameOverlay presetId="square-standard" onChange={onChange} pedestal={{ preset: 'none', color: 'warm-white', cornerRadiusMm: 8 }} onPedestalPresetChange={vi.fn()} onPedestalColorChange={vi.fn()} onPedestalRadiusChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '3000 × 3000' }))
    expect(onChange).toHaveBeenCalledWith('square-hd')
  })

  it('switches pedestal preset and color without adding a settings area', async () => {
    const user = userEvent.setup()
    const onPreset = vi.fn()
    const onColor = vi.fn()
    const onRadius = vi.fn()
    render(<ExportFrameOverlay presetId="square-standard" onChange={vi.fn()} pedestal={{ preset: 'steps', color: 'warm-white', cornerRadiusMm: 8 }} onPedestalPresetChange={onPreset} onPedestalColorChange={onColor} onPedestalRadiusChange={onRadius} />)

    await user.click(screen.getByRole('button', { name: '岛屿展台' }))
    expect(onPreset).toHaveBeenCalledWith('islands')

    await user.click(screen.getByRole('button', { name: '浅粉' }))
    expect(onColor).toHaveBeenCalledWith('light-pink')

    fireEvent.change(screen.getByRole('slider', { name: '展台圆角' }), { target: { value: '18' } })
    expect(onRadius).toHaveBeenCalledWith(18)
  })

  it('keeps pedestal fallback feedback inside the external tool rail', () => {
    render(<ExportFrameOverlay presetId="square-standard" onChange={vi.fn()} pedestal={{ preset: 'steps', color: 'warm-white', cornerRadiusMm: 8 }} pedestalNotice="当前组合已回退到安全展台" onPedestalPresetChange={vi.fn()} onPedestalColorChange={vi.fn()} onPedestalRadiusChange={vi.fn()} />)

    const notice = screen.getByRole('status')
    expect(notice).toHaveTextContent('当前组合已回退到安全展台')
    expect(notice.closest('.preview-primary-toolbar')).not.toBeNull()
  })
})
