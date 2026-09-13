import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { getExportPreset } from '../export/exportFrame'
import { ProjectToolbar } from './ProjectToolbar'

describe('ProjectToolbar', () => {
  it('connects every visible desktop action to a handler', async () => {
    const user = userEvent.setup()
    const handlers = {
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      onNew: vi.fn(),
      onOpen: vi.fn(),
      onSave: vi.fn(),
      onHelp: vi.fn(),
      onExport: vi.fn(),
    }
    render(
      <ProjectToolbar
        name="测试项目"
        onNameChange={vi.fn()}
        canUndo
        canRedo
        exportPreset={getExportPreset('landscape-2k')}
        {...handlers}
      />,
    )

    for (const [label, handler] of [
      ['撤销', handlers.onUndo],
      ['重做', handlers.onRedo],
      ['新建', handlers.onNew],
      ['打开', handlers.onOpen],
      ['保存', handlers.onSave],
      ['帮助', handlers.onHelp],
    ] as const) {
      await user.click(screen.getByRole('button', { name: label }))
      expect(handler).toHaveBeenCalledOnce()
    }

    await user.click(screen.getByRole('button', { name: '导出' }))
    for (const label of [
      '导出 PNG（无投影）· 2560 × 1440',
      '导出 PNG（有投影）· 2560 × 1440',
    ]) {
      expect(screen.getByRole('menuitem', { name: label })).toBeInTheDocument()
    }

    await user.click(screen.getByRole('menuitem', { name: '导出 PNG（有投影）· 2560 × 1440' }))
    expect(handlers.onExport).toHaveBeenCalledWith({ width: 2560, height: 1440, includeShadow: true })
    expect(screen.queryByRole('menu', { name: 'PNG 导出选项' })).not.toBeInTheDocument()
  })

  it('exposes the hidden project actions from the mobile more menu', async () => {
    const user = userEvent.setup()
    const handlers = {
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      onNew: vi.fn(),
      onOpen: vi.fn(),
      onSave: vi.fn(),
      onHelp: vi.fn(),
      onExport: vi.fn(),
    }
    render(
      <ProjectToolbar
        name="测试项目"
        onNameChange={vi.fn()}
        canUndo
        canRedo
        exportPreset={getExportPreset('square-standard')}
        {...handlers}
      />,
    )

    const more = screen.getByRole('button', { name: '更多' })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    await user.click(more)

    expect(more).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu', { name: '更多工程操作' })
    await user.click(within(menu).getByRole('menuitem', { name: '打开' }))
    expect(handlers.onOpen).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu', { name: '更多工程操作' })).not.toBeInTheDocument()
  })
})
