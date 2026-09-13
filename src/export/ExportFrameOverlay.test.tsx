import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ExportFrameOverlay } from './ExportFrameOverlay'

describe('ExportFrameOverlay', () => {
  it('shows the fixed frame size and switches aspect ratios', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ExportFrameOverlay presetId="square-standard" onChange={onChange} pedestal={{ preset: 'none', color: 'warm-white' }} onPedestalPresetChange={vi.fn()} onPedestalColorChange={vi.fn()} />)

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
    render(<ExportFrameOverlay presetId="square-standard" onChange={onChange} pedestal={{ preset: 'none', color: 'warm-white' }} onPedestalPresetChange={vi.fn()} onPedestalColorChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '3000 × 3000' }))
    expect(onChange).toHaveBeenCalledWith('square-hd')
  })

  it('switches pedestal preset and color without adding a settings area', async () => {
    const user = userEvent.setup()
    const onPreset = vi.fn()
    const onColor = vi.fn()
    render(<ExportFrameOverlay presetId="square-standard" onChange={vi.fn()} pedestal={{ preset: 'steps', color: 'warm-white' }} onPedestalPresetChange={onPreset} onPedestalColorChange={onColor} />)

    await user.click(screen.getByRole('button', { name: '岛屿展台' }))
    expect(onPreset).toHaveBeenCalledWith('islands')

    await user.click(screen.getByRole('button', { name: '浅粉' }))
    expect(onColor).toHaveBeenCalledWith('light-pink')
  })
})
