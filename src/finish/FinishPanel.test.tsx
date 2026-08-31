import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createDefaultBoxFinish, createDefaultPouchFinish } from './finishTypes'
import { FinishPanel } from './FinishPanel'

describe('FinishPanel', () => {
  it('shows five finish layers and six explicit face mask uploads', () => {
    render(<FinishPanel value={createDefaultBoxFinish()} errors={{}} onAction={vi.fn()} />)

    expect(screen.getAllByRole('tab')).toHaveLength(5)
    const finishInputs = screen.getAllByLabelText(/^上传.+烫金蒙版$/) as HTMLInputElement[]
    expect(finishInputs).toHaveLength(6)
    expect(finishInputs.every((input) => input.hidden)).toBe(true)
    expect(screen.getByRole('checkbox', { name: '显示烫金' })).toBeChecked()
    expect(screen.queryAllByRole('button', { name: /^移除.+烫金蒙版$/ })).toHaveLength(0)
  })

  it('shows and edits transform controls for an uploaded mask', async () => {
    const user = userEvent.setup()
    const value = createDefaultBoxFinish()
    value.layers['gold-foil'].masks.front = {
      asset: {
        id: 'front', name: 'front.png', mimeType: 'image/png', width: 100, height: 100,
        previewUrl: 'data:image/png;base64,AAAA',
      },
      transform: { scale: 100, offsetX: 0, offsetY: 0, rotation: 0 },
    }
    const onAction = vi.fn()
    render(<FinishPanel value={value} errors={{}} onAction={onAction} />)

    expect(screen.getByRole('button', { name: '移除正面烫金蒙版' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '选择正面烫金蒙版' }))
    fireEvent.change(screen.getByRole('slider', { name: '工艺贴图缩放' }), {
      target: { value: '160' },
    })

    expect(onAction).toHaveBeenCalledWith({
      type: 'box-finish/mask-transform-set', kind: 'gold-foil', face: 'front', key: 'scale', value: 160,
    })
  })

  it('shows only front and back masks and pouch actions for a stand-up pouch', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(<FinishPanel
      value={createDefaultPouchFinish()}
      scope="pouch-finish"
      faces={['front', 'back']}
      faceLabels={{ front: '正面', back: '背面' }}
      errors={{}}
      onAction={onAction}
    />)

    expect(screen.getAllByLabelText(/^上传.+烫金蒙版$/)).toHaveLength(2)
    await user.click(screen.getByRole('tab', { name: /烫银/ }))
    expect(onAction).toHaveBeenCalledWith({ type: 'pouch-finish/select-kind', kind: 'silver-foil' })
  })
})
