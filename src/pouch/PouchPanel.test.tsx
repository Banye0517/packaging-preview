import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createInitialProject, getSelectedInstance } from '../app/projectReducer'
import { PouchPanel } from './PouchPanel'

describe('PouchPanel', () => {
  it('offers thickness, rounded corners and mutually exclusive closures', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <PouchPanel pouch={getSelectedInstance(createInitialProject()).pouch} onChange={onChange} />,
    )

    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('spinbutton', { name: '袋体厚度（毫米）' })).toHaveValue(16)
    expect(screen.getByLabelText('四角圆角')).toBeChecked()

    await user.click(screen.getByRole('radio', { name: '顶部居中吸嘴' }))
    expect(onChange).toHaveBeenCalledWith('closure', 'spout')
  })
})
