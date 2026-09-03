import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../scene/BoxScene', () => ({
  BoxScene: ({ project }: { project: { packagingType: string } }) => (
    <div data-testid="packaging-scene" data-type={project.packagingType} />
  ),
}))

import { App } from './App'

describe('App', () => {
  it('renders the independent BoxLab workspace', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: '包装盒三维预览区' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('complementary', { name: '包装设置' }),
    ).toBeInTheDocument()
  })

  it('renders the approved four-tab workspace without scene or AI', () => {
    render(<App />)

    expect(screen.getByRole('textbox', { name: '项目名称' })).toHaveValue(
      '未命名包装',
    )
    expect(screen.getAllByRole('tab')).toHaveLength(4)
    expect(screen.getByRole('tab', { name: '贴图' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.queryByRole('tab', { name: '场景' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'AI' })).not.toBeInTheDocument()
  })

  it('shows exactly six explicit face uploads in the artwork panel', () => {
    render(<App />)

    expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(6)
  })

  it('opens functional box controls without a scene panel', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: '盒型' }))

    expect(screen.getByRole('spinbutton', { name: '盒宽（毫米）' })).toHaveValue(160)
    expect(screen.getByRole('spinbutton', { name: '盒高（毫米）' })).toHaveValue(220)
    expect(screen.queryByRole('tab', { name: '场景' })).not.toBeInTheDocument()
  })

  it('switches to a pouch model and exactly two artwork uploads', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: '盒型' }))
    await user.click(screen.getByRole('radio', { name: '自立袋' }))
    expect(screen.getByTestId('packaging-scene')).toHaveAttribute('data-type', 'pouch')
    expect(screen.getByRole('spinbutton', { name: '袋体厚度（毫米）' })).toHaveValue(16)

    await user.click(screen.getByRole('tab', { name: '贴图' }))
    expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(2)
  })

  it('restores six box uploads after switching back', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: '盒型' }))
    await user.click(screen.getByRole('radio', { name: '自立袋' }))
    await user.click(screen.getByRole('radio', { name: '六面盒型' }))
    await user.click(screen.getByRole('tab', { name: '贴图' }))

    expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(6)
    expect(screen.getByTestId('packaging-scene')).toHaveAttribute('data-type', 'box')
  })

  it('switches to inner packaging with one UV upload and width-height controls only', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: '盒型' }))
    await user.click(screen.getByRole('radio', { name: '内包装1' }))

    expect(screen.getByTestId('packaging-scene')).toHaveAttribute(
      'data-type',
      'inner-packaging-1',
    )
    expect(screen.getByRole('spinbutton', { name: '袋宽（毫米）' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: '袋高（毫米）' })).toBeInTheDocument()
    expect(screen.queryByRole('spinbutton', { name: '袋体厚度（毫米）' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: '贴图' }))
    expect(screen.getByRole('heading', { name: '内包装1印刷贴图' })).toBeInTheDocument()
    expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(1)
    expect(screen.getByLabelText('上传完整UV贴图印刷图')).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '贴图缩放' })).toHaveValue('100')
    expect(screen.getByRole('slider', { name: '水平位置' })).toHaveValue('0')
    expect(screen.getByRole('slider', { name: '垂直位置' })).toHaveValue('0')
    expect(screen.getByRole('slider', { name: '贴图旋转' })).toHaveValue('0')
    expect(screen.getByRole('slider', { name: '水平拉伸' })).toHaveValue('100')
    expect(screen.getByRole('slider', { name: '垂直拉伸' })).toHaveValue('100')
    expect(screen.getByRole('button', { name: '重置贴图' })).toBeInTheDocument()
  })

  it('updates and resets inner packaging artwork controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: '盒型' }))
    await user.click(screen.getByRole('radio', { name: '内包装1' }))
    await user.click(screen.getByRole('tab', { name: '贴图' }))

    fireEvent.change(screen.getByRole('slider', { name: '贴图缩放' }), {
      target: { value: '160' },
    })
    fireEvent.change(screen.getByRole('slider', { name: '水平位置' }), {
      target: { value: '25' },
    })
    fireEvent.change(screen.getByRole('slider', { name: '垂直位置' }), {
      target: { value: '-18' },
    })
    fireEvent.change(screen.getByRole('slider', { name: '贴图旋转' }), {
      target: { value: '35' },
    })
    fireEvent.change(screen.getByRole('slider', { name: '水平拉伸' }), {
      target: { value: '140' },
    })
    fireEvent.change(screen.getByRole('slider', { name: '垂直拉伸' }), {
      target: { value: '80' },
    })

    expect(screen.getByRole('spinbutton', { name: '贴图缩放数值' })).toHaveValue(160)
    expect(screen.getByRole('spinbutton', { name: '水平位置数值' })).toHaveValue(25)
    expect(screen.getByRole('spinbutton', { name: '垂直位置数值' })).toHaveValue(-18)
    expect(screen.getByRole('spinbutton', { name: '贴图旋转数值' })).toHaveValue(35)
    expect(screen.getByRole('spinbutton', { name: '水平拉伸数值' })).toHaveValue(140)
    expect(screen.getByRole('spinbutton', { name: '垂直拉伸数值' })).toHaveValue(80)

    await user.click(screen.getByRole('button', { name: '重置贴图' }))
    expect(screen.getByRole('slider', { name: '贴图缩放' })).toHaveValue('100')
    expect(screen.getByRole('slider', { name: '水平位置' })).toHaveValue('0')
    expect(screen.getByRole('slider', { name: '垂直位置' })).toHaveValue('0')
    expect(screen.getByRole('slider', { name: '贴图旋转' })).toHaveValue('0')
    expect(screen.getByRole('slider', { name: '水平拉伸' })).toHaveValue('100')
    expect(screen.getByRole('slider', { name: '垂直拉伸' })).toHaveValue('100')
  })

  it('shows six box finish masks and two pouch finish masks', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: '工艺' }))
    expect(screen.getByRole('heading', { name: '表面工艺' })).toBeInTheDocument()
    expect(screen.getAllByLabelText(/^上传.+烫金蒙版$/)).toHaveLength(6)

    await user.click(screen.getByRole('tab', { name: '盒型' }))
    await user.click(screen.getByRole('radio', { name: '自立袋' }))
    await user.click(screen.getByRole('tab', { name: '工艺' }))
    expect(screen.getByRole('heading', { name: '表面工艺' })).toBeInTheDocument()
    expect(screen.getAllByLabelText(/^上传.+烫金蒙版$/)).toHaveLength(2)
  })

  it('switches to inner packaging 2 with two independent face uploads and no finish', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: '盒型' }))
    await user.click(screen.getByRole('radio', { name: '内包装2' }))
    expect(screen.getByTestId('packaging-scene')).toHaveAttribute(
      'data-type',
      'inner-packaging-2',
    )
    expect(screen.getByRole('heading', { name: '内包装2设置' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: '贴图' }))
    expect(screen.getByRole('heading', { name: '内包装2印刷贴图' })).toBeInTheDocument()
    expect(screen.getAllByLabelText(/^上传(正面|背面)印刷图$/)).toHaveLength(2)
    expect(screen.getByText('高级调整').closest('details')).not.toHaveAttribute('open')
    expect(screen.getByRole('slider', { name: '水平拉伸' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: '工艺' }))
    expect(screen.getByText('内包装2暂不支持表面工艺。')).toBeInTheDocument()
  })

  it('switches to hanging tissue with four face uploads and a pulled-sheet switch', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: '盒型' }))
    await user.click(screen.getByRole('radio', { name: '悬挂抽纸' }))
    expect(screen.getByTestId('packaging-scene')).toHaveAttribute('data-type', 'hanging-tissue')
    expect(screen.getByRole('checkbox', { name: '显示抽纸' })).toBeChecked()

    await user.click(screen.getByRole('tab', { name: '贴图' }))
    expect(screen.getByRole('heading', { name: '悬挂抽纸印刷贴图' })).toBeInTheDocument()
    expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(4)
    expect(screen.queryByLabelText('上传顶部印刷图')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('上传底部印刷图')).not.toBeInTheDocument()
  })

  it('switches to face tissue with one full-UV upload and a top-sheet switch', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: '盒型' }))
    await user.click(screen.getByRole('radio', { name: '面纸' }))
    expect(screen.getByTestId('packaging-scene')).toHaveAttribute('data-type', 'face-tissue')
    expect(screen.getByRole('spinbutton', { name: '盒身厚度（毫米）' })).toHaveValue(80)
    expect(screen.getByRole('checkbox', { name: '顶部抽纸' })).toBeChecked()

    await user.click(screen.getByRole('tab', { name: '贴图' }))
    expect(screen.getByRole('heading', { name: '面纸印刷贴图' })).toBeInTheDocument()
    expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(1)
    expect(screen.getByLabelText('上传面纸图稿（完整 UV）印刷图')).toBeInTheDocument()
    expect(screen.getByText('高级调整').closest('details')).toHaveAttribute('open')

    await user.click(screen.getByRole('tab', { name: '盒型' }))
    await user.click(screen.getByRole('checkbox', { name: '顶部抽纸' }))
    expect(screen.getByRole('checkbox', { name: '顶部抽纸' })).not.toBeChecked()
  })

  it('switches to wet tissue with two full-UV uploads and open/closed controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: '盒型' }))
    await user.click(screen.getByRole('radio', { name: '湿纸巾' }))
    expect(screen.getByTestId('packaging-scene')).toHaveAttribute('data-type', 'wet-tissue')
    expect(screen.getByRole('radio', { name: '打开' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: '顶部纸张' })).toBeChecked()
    expect(screen.getByRole('spinbutton', { name: '盒身厚度（毫米）' })).toHaveValue(80)

    await user.click(screen.getByRole('tab', { name: '贴图' }))
    expect(screen.getByRole('heading', { name: '湿纸巾印刷贴图' })).toBeInTheDocument()
    expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(2)
    expect(screen.getByLabelText('上传纸盒贴纸（完整 UV）印刷图')).toBeInTheDocument()
    expect(screen.getByLabelText('上传盖子贴纸（完整 UV）印刷图')).toBeInTheDocument()
    expect(screen.getByText('高级调整').closest('details')).not.toHaveAttribute('open')

    await user.click(screen.getByRole('tab', { name: '盒型' }))
    await user.click(screen.getByRole('radio', { name: '关闭' }))
    expect(screen.getByRole('radio', { name: '关闭' })).toBeChecked()
  })

  it('switches to wash tissue with one full-UV upload and a paper visibility switch', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: '盒型' }))
    await user.click(screen.getByRole('radio', { name: '洗脸巾' }))
    expect(screen.getByTestId('packaging-scene')).toHaveAttribute('data-type', 'wash-tissue')
    expect(screen.getByRole('heading', { name: '洗脸巾设置' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '顶部纸张' })).toBeChecked()

    await user.click(screen.getByRole('tab', { name: '贴图' }))
    expect(screen.getByRole('heading', { name: '洗脸巾印刷贴图' })).toBeInTheDocument()
    expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(1)
    expect(screen.getByLabelText('上传洗脸巾图稿（完整 UV）印刷图')).toBeInTheDocument()
    expect(screen.getByText('高级调整').closest('details')).not.toHaveAttribute('open')
  })
})
