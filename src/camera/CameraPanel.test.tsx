import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CameraPanel } from './CameraPanel'

describe('CameraPanel', () => {
  it('shows and updates the artwork lighting intensity', () => {
    const onLightingIntensityChange = vi.fn()
    render(
      <CameraPanel
        autoRotate={false}
        lightingIntensity={35}
        onAutoRotateChange={() => undefined}
        onLightingIntensityChange={onLightingIntensityChange}
      />,
    )

    expect(screen.getByRole('slider', { name: '打光强度' })).toHaveValue('35')
    expect(screen.getByRole('spinbutton', { name: '打光强度数值' })).toHaveValue(35)
    expect(screen.getByText('%')).toBeInTheDocument()
    expect(screen.getByText('减弱')).toBeInTheDocument()
    expect(screen.getByText('标准')).toBeInTheDocument()
    expect(screen.getByText('增强')).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '打光强度' })).toHaveAttribute('min', '-100')

    fireEvent.change(screen.getByRole('slider', { name: '打光强度' }), {
      target: { value: '72' },
    })
    expect(onLightingIntensityChange).toHaveBeenCalledWith(72)

    fireEvent.change(screen.getByRole('spinbutton', { name: '打光强度数值' }), {
      target: { value: '48' },
    })
    expect(onLightingIntensityChange).toHaveBeenCalledWith(48)
  })
})
