# 固定导出取景框 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 3D 预览中增加与 PNG 导出逐边一致的 C4D 式固定取景框，并支持 800×800、3000×3000、2560×1440、1440×2560。

**Architecture:** 新建纯函数模块统一管理导出 preset、取景框矩形和 overscan 相机投影。React 只管理当前 preset 和绘制 DOM 覆盖层；Three.js 预览相机只更新投影，不因切换比例移动位置，导出器临时切换到同一 preset 的原始 FOV 与宽高后恢复现场。

**Tech Stack:** React 19、TypeScript、Three.js、React Three Fiber、Vitest、Testing Library、CSS

---

## 文件结构

- Create: `src/export/exportFrame.ts` — 导出规格、固定框矩形和预览 overscan 投影的唯一事实来源。
- Create: `src/export/exportFrame.test.ts` — 横版、竖版、正方形和投影一致性单元测试。
- Create: `src/export/ExportFrameOverlay.tsx` — 比例/分辨率控制、尺寸标签、遮罩和固定框。
- Create: `src/export/ExportFrameOverlay.test.tsx` — 控件切换、尺寸标签和非阻断覆盖层测试。
- Modify: `src/export/transparentPng.ts` — 从单个 `size` 改为明确的 `width`/`height`，导出后恢复相机 FOV 与 aspect。
- Modify: `src/export/transparentPng.test.ts` — 覆盖四种像素尺寸、投影开关和异常恢复。
- Modify: `src/scene/BoxScene.tsx` — 接收 preset；预览采用 overscan 投影；导出复用 preset。
- Modify: `src/scene/BoxScene.test.tsx` — 验证 preset 被场景控制器消费，且取景框切换不触发位置重置。
- Modify: `src/shell/ProjectToolbar.tsx` — 导出菜单只选择投影，并显示当前像素尺寸。
- Modify: `src/shell/ProjectToolbar.test.tsx` — 验证新菜单文案与 `{ width, height, includeShadow }` 请求。
- Modify: `src/app/App.tsx` — 保存会话级 preset，连接覆盖层、场景和下载文件名。
- Modify: `src/styles.css` — 固定框、四边遮罩、画幅按钮和移动端尺寸。

### Task 1: 建立导出画幅与投影数学

**Files:**
- Create: `src/export/exportFrame.ts`
- Create: `src/export/exportFrame.test.ts`

- [ ] **Step 1: 写失败测试**

测试四个 preset，并验证框在带安全边距的 viewport 中等比居中；再验证框内边界投影与导出相机边界一致。

```ts
import { describe, expect, it } from 'vitest'
import {
  calculateExportFrameRect,
  calculatePreviewFov,
  EXPORT_PRESETS,
  getExportFramePadding,
  getExportPreset,
} from './exportFrame'

describe('exportFrame', () => {
  it('defines the four supported export sizes', () => {
    expect(EXPORT_PRESETS.map(({ width, height }) => [width, height])).toEqual([
      [800, 800], [3000, 3000], [2560, 1440], [1440, 2560],
    ])
  })

  it('centers a landscape frame inside the padded viewport', () => {
    const frame = calculateExportFrameRect(1200, 800, getExportPreset('landscape-2k'), 56)
    expect(frame.width / frame.height).toBeCloseTo(16 / 9)
    expect(frame.left).toBeCloseTo((1200 - frame.width) / 2)
    expect(frame.top).toBeCloseTo((800 - frame.height) / 2)
  })

  it('uses overscan fov so the fixed frame matches the export crop', () => {
    const frame = calculateExportFrameRect(1200, 800, getExportPreset('portrait-2k'), 56)
    const previewFov = calculatePreviewFov(38, 800, frame.height)
    const previewHalfHeight = Math.tan(previewFov * Math.PI / 360)
    const frameHalfHeight = previewHalfHeight * frame.height / 800
    expect(frameHalfHeight).toBeCloseTo(Math.tan(38 * Math.PI / 360), 6)
  })

  it('uses the same responsive padding source for desktop and mobile', () => {
    expect(getExportFramePadding(1200)).toBe(56)
    expect(getExportFramePadding(390)).toBe(34)
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/export/exportFrame.test.ts`

Expected: FAIL，提示 `./exportFrame` 不存在。

- [ ] **Step 3: 实现最小纯函数模块**

```ts
export type ExportPresetId = 'square-standard' | 'square-hd' | 'landscape-2k' | 'portrait-2k'
export type ExportRatio = '1:1' | '16:9' | '9:16'

export interface ExportPreset {
  id: ExportPresetId
  ratio: ExportRatio
  width: number
  height: number
}

export interface ExportFrameRect {
  left: number
  top: number
  width: number
  height: number
}

export const EXPORT_PRESETS: readonly ExportPreset[] = [
  { id: 'square-standard', ratio: '1:1', width: 800, height: 800 },
  { id: 'square-hd', ratio: '1:1', width: 3000, height: 3000 },
  { id: 'landscape-2k', ratio: '16:9', width: 2560, height: 1440 },
  { id: 'portrait-2k', ratio: '9:16', width: 1440, height: 2560 },
]

export const DEFAULT_EXPORT_PRESET_ID: ExportPresetId = 'square-standard'

export function getExportFramePadding(viewportWidth: number) {
  return viewportWidth <= 720 ? 34 : 56
}

export function getExportPreset(id: ExportPresetId) {
  return EXPORT_PRESETS.find((preset) => preset.id === id) ?? EXPORT_PRESETS[0]
}

export function calculateExportFrameRect(
  viewportWidth: number,
  viewportHeight: number,
  preset: ExportPreset,
  padding: number,
): ExportFrameRect {
  const availableWidth = Math.max(1, viewportWidth - padding * 2)
  const availableHeight = Math.max(1, viewportHeight - padding * 2)
  const ratio = preset.width / preset.height
  const width = Math.min(availableWidth, availableHeight * ratio)
  const height = width / ratio
  return { left: (viewportWidth - width) / 2, top: (viewportHeight - height) / 2, width, height }
}

export function calculatePreviewFov(exportFov: number, viewportHeight: number, frameHeight: number) {
  const radians = exportFov * Math.PI / 180
  return Math.atan(Math.tan(radians / 2) * viewportHeight / Math.max(frameHeight, 1)) * 360 / Math.PI
}
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `npm run test:run -- src/export/exportFrame.test.ts`

Expected: PASS，4 tests。

- [ ] **Step 5: 提交**

```bash
git add src/export/exportFrame.ts src/export/exportFrame.test.ts
git commit -m "feat: define export frame presets"
```

### Task 2: 支持矩形透明 PNG 导出

**Files:**
- Modify: `src/export/transparentPng.ts`
- Modify: `src/export/transparentPng.test.ts`

- [ ] **Step 1: 把现有测试改成矩形请求并增加恢复断言**

```ts
const camera = new PerspectiveCamera(38, 1.6)
renderTransparentPng(renderer, scene, camera, {
  width: 2560,
  height: 1440,
  includeShadow: false,
  shadowGroup,
  exportFov: 38,
})

expect(renderer.setSize).toHaveBeenNthCalledWith(1, 2560, 1440, false)
expect(camera.aspect).toBe(1.6)
expect(camera.fov).toBe(38)
```

为 800×800、3000×3000、2560×1440、1440×2560 使用 `it.each` 验证 `renderer.setSize(width, height, false)`；编码异常测试同时断言 size、pixel ratio、背景、shadow、aspect 和 FOV 全部恢复。

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/export/transparentPng.test.ts`

Expected: FAIL，旧接口仍要求 `size`，且仍调用正方形 `setSize`。

- [ ] **Step 3: 修改导出接口与实现**

```ts
export interface TransparentPngOptions {
  width: number
  height: number
  includeShadow: boolean
  exportFov: number
  shadowGroup?: Object3D | null
}

export interface PngExportSelection {
  width: number
  height: number
  includeShadow: boolean
}
```

在 `renderTransparentPng` 中记录 `previousFov`；导出前执行：

```ts
renderer.setSize(width, height, false)
camera.aspect = width / height
camera.fov = exportFov
camera.updateProjectionMatrix()
```

在 `finally` 中恢复 `camera.fov = previousFov`，保留当前所有 renderer、scene、shadow 和相机恢复逻辑。删除旧的 `PngExportSize` 与静态四项 `PNG_EXPORT_OPTIONS`。

- [ ] **Step 4: 运行测试并确认通过**

Run: `npm run test:run -- src/export/transparentPng.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/export/transparentPng.ts src/export/transparentPng.test.ts
git commit -m "feat: export rectangular transparent pngs"
```

### Task 3: 增加固定取景框与画幅控件

**Files:**
- Create: `src/export/ExportFrameOverlay.tsx`
- Create: `src/export/ExportFrameOverlay.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: 写组件失败测试**

```tsx
it('switches ratio and square resolution without blocking the canvas', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<ExportFrameOverlay presetId="square-standard" onChange={onChange} />)

  expect(screen.getByText('PNG 导出范围 · 800 × 800')).toBeInTheDocument()
  expect(screen.getByTestId('export-frame-mask')).toHaveClass('export-frame-overlay--pass-through')

  await user.click(screen.getByRole('button', { name: '16:9' }))
  expect(onChange).toHaveBeenCalledWith('landscape-2k')

  await user.click(screen.getByRole('button', { name: '3000 × 3000' }))
  expect(onChange).toHaveBeenCalledWith('square-hd')
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/export/ExportFrameOverlay.test.tsx`

Expected: FAIL，组件不存在。

- [ ] **Step 3: 实现组件**

组件根节点用 `ResizeObserver` 读取预览区尺寸，并用 `getExportFramePadding` 与 `calculateExportFrameRect` 计算框。画幅按钮本身允许点击；框线、标签和四边遮罩放在独立的 `pointer-events: none` 层。比例映射固定为：`1:1 → 当前 square preset`、`16:9 → landscape-2k`、`9:16 → portrait-2k`。选择 `1:1` 时才显示两个正方形分辨率按钮。

关键结构：

```tsx
<div className="export-frame-ui">
  <div className="export-ratio-controls" aria-label="导出画幅">
    {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
      <button type="button" aria-pressed={preset.ratio === ratio} onClick={() => selectRatio(ratio)}>
        {ratio}
      </button>
    ))}
  </div>
  {preset.ratio === '1:1' ? <SquareResolutionControls presetId={presetId} onChange={onChange} /> : null}
  <div data-testid="export-frame-mask" className="export-frame-overlay export-frame-overlay--pass-through">
    <div className="export-frame" style={frameStyle}>
      <span>PNG 导出范围 · {preset.width} × {preset.height}</span>
    </div>
  </div>
</div>
```

CSS 使用四个绝对定位遮罩区域包围 `.export-frame`，不能用巨大 `box-shadow` 覆盖浏览器交互命中；所有遮罩透明度保持能看清越界模型。移动端画幅按钮避开底部相机控件，框的 34px 安全边距仍由共享纯函数决定，避免 CSS 与 Three.js 投影产生两套数值。

- [ ] **Step 4: 运行组件测试与 lint**

Run: `npm run test:run -- src/export/ExportFrameOverlay.test.tsx && npm run lint`

Expected: PASS；ESLint 0 errors。

- [ ] **Step 5: 提交**

```bash
git add src/export/ExportFrameOverlay.tsx src/export/ExportFrameOverlay.test.tsx src/styles.css
git commit -m "feat: add fixed export frame overlay"
```

### Task 4: 让预览相机与固定框逐边一致

**Files:**
- Modify: `src/scene/BoxScene.tsx`
- Modify: `src/scene/BoxScene.test.tsx`

- [ ] **Step 1: 写失败测试**

扩展 R3F mock，提供可记录的 PerspectiveCamera；渲染 `BoxScene` 后切换 preset，断言位置未改变，只更新 `fov`、`aspect` 与 projection matrix。另断言命令复位和 bounds 变化仍调用现有组合 fit。

```ts
const before = camera.position.clone()
rerender(<BoxScene project={project} command={null} exportPreset={getExportPreset('portrait-2k')} />)
expect(camera.position.toArray()).toEqual(before.toArray())
expect(camera.updateProjectionMatrix).toHaveBeenCalled()
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/scene/BoxScene.test.tsx`

Expected: FAIL，`BoxScene` 尚未接收 `exportPreset`。

- [ ] **Step 3: 接入预览投影控制器**

给 `BoxSceneProps` 增加 `exportPreset: ExportPreset`，并把 `exportPreset` 同时传给 `CameraControls` 和 `ExportController`。新增 `EXPORT_CAMERA_FOV = 38`；框边距始终调用 Task 1 的 `getExportFramePadding(size.width)`。

在 `CameraControls` 增加独立 projection effect：

```ts
useEffect(() => {
  if (!('isPerspectiveCamera' in camera)) return
  const padding = getExportFramePadding(size.width)
  const frame = calculateExportFrameRect(size.width, size.height, exportPreset, padding)
  camera.aspect = size.width / Math.max(size.height, 1)
  camera.fov = calculatePreviewFov(EXPORT_CAMERA_FOV, size.height, frame.height)
  camera.updateProjectionMatrix()
}, [camera, exportPreset, size.height, size.width])
```

此 effect 不修改 `camera.position` 或 OrbitControls target。现有 bounds/命令 fit 改为使用 `EXPORT_CAMERA_FOV` 和 `exportPreset.width / exportPreset.height`，确保只有 bounds 或显式相机命令发生时才重新适配组合；单独切换 preset 不进入 position fit effect。

`ExportController` 将 preset 转成 `{ width, height, exportFov: EXPORT_CAMERA_FOV }` 传给 `renderTransparentPng`。

- [ ] **Step 4: 运行场景与相机测试**

Run: `npm run test:run -- src/scene/BoxScene.test.tsx src/scene/fitCompositionCamera.test.ts`

Expected: PASS，且原有 orbit-safe clipping 测试继续通过。

- [ ] **Step 5: 提交**

```bash
git add src/scene/BoxScene.tsx src/scene/BoxScene.test.tsx
git commit -m "feat: align preview camera with export frame"
```

### Task 5: 连接应用状态、菜单与下载文件名

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/shell/ProjectToolbar.tsx`
- Modify: `src/shell/ProjectToolbar.test.tsx`

- [ ] **Step 1: 修改 Toolbar 失败测试**

```tsx
render(
  <ProjectToolbar
    exportPreset={getExportPreset('landscape-2k')}
    onExport={onExport}
    {...requiredProps}
  />,
)
await user.click(screen.getByRole('button', { name: '导出' }))
expect(screen.getByRole('menuitem', { name: '导出 PNG（无投影）· 2560 × 1440' })).toBeInTheDocument()
await user.click(screen.getByRole('menuitem', { name: '导出 PNG（有投影）· 2560 × 1440' }))
expect(onExport).toHaveBeenCalledWith({ width: 2560, height: 1440, includeShadow: true })
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/shell/ProjectToolbar.test.tsx`

Expected: FAIL，Toolbar 仍显示旧的四项正方形导出。

- [ ] **Step 3: 实现应用接线**

在 `App` 增加：

```ts
const [exportPresetId, setExportPresetId] = useState<ExportPresetId>(DEFAULT_EXPORT_PRESET_ID)
const exportPreset = getExportPreset(exportPresetId)
```

把 `exportPreset` 传给 `BoxScene` 和 `ProjectToolbar`，并在 `.preview-stage` 内、Canvas 之后渲染：

```tsx
<ExportFrameOverlay presetId={exportPresetId} onChange={setExportPresetId} />
```

`ProjectToolbar` 根据当前 preset 生成有/无投影两个按钮。`handleExport` 使用明确宽高，并把文件名改为：

```ts
`${name || '未命名包装'}-${selection.width}x${selection.height}-${selection.includeShadow ? '带投影' : '无投影'}.png`
```

画幅状态不写入 `ProjectState`、history 或 codec；新建/打开项目后执行 `setExportPresetId(DEFAULT_EXPORT_PRESET_ID)`。

- [ ] **Step 4: 运行相关测试、类型检查和 lint**

Run: `npm run test:run -- src/export src/scene/BoxScene.test.tsx src/shell/ProjectToolbar.test.tsx && npm run typecheck && npm run lint`

Expected: 全部 PASS，TypeScript 与 ESLint 0 errors。

- [ ] **Step 5: 提交**

```bash
git add src/app/App.tsx src/shell/ProjectToolbar.tsx src/shell/ProjectToolbar.test.tsx
git commit -m "feat: connect export frame workflow"
```

### Task 6: 全量回归与真实浏览器验收

**Files:**
- Verify only: `src/`
- Verify only: `tests/sites-worker.test.mjs`

- [ ] **Step 1: 运行全量自动检查**

Run: `npm run test:run && npm run typecheck && npm run lint && npm run build && npm run test:sites`

Expected: 全部通过；build 保留 `dist/client/index.html`、`dist/server/index.js`、`dist/.openai/hosting.json`。

- [ ] **Step 2: 在真实浏览器验证固定框交互**

启动本地 Vite，使用 Ego Lite 独立测试标签页。分别检查桌面和移动宽度：

1. 取景框固定且框外压暗后仍能看清模型。
2. 在框内、框线附近和框外拖动均可旋转；滚轮缩放可让模型越界。
3. 切换 1:1、16:9、9:16 时相机位置和旋转不跳回。
4. 添加到六个混合包装，组合仍落地且不穿插。

- [ ] **Step 3: 逐画幅实际导出并核验像素**

至少导出以下四张代表性 PNG：

- `800 × 800` 无投影
- `3000 × 3000` 有投影
- `2560 × 1440` 无投影
- `1440 × 2560` 有投影

用 `sips -g pixelWidth -g pixelHeight <file>` 核验尺寸；将一个模型明显移出框边后导出，肉眼比对 PNG 四边与预览框四边一致，并确认 UI 框线、标签、工作区背景没有进入 PNG。

- [ ] **Step 4: 回归保存/打开与组合行为**

保存一个六包装项目并重新打开，确认项目 codec 未升级、包装数据完整、画幅恢复默认 `1:1 · 800 × 800`，且 A/B/C/D 排列、落地、居中和相机命令正常。

- [ ] **Step 5: 修复验收中发现的问题并重复全量检查**

如任何检查失败，先增加能复现问题的失败测试，再做最小修复，重复 Step 1–4，直至全部通过。

- [ ] **Step 6: 提交最终验证修复（仅在有改动时）**

```bash
git add src
git commit -m "fix: finalize export frame behavior"
```

## 完成定义

- 取景框固定、模型可自由越界、预览与实际 PNG 裁切逐边一致。
- 四种像素尺寸和有/无投影均工作。
- 模型、组合、贴图、真实尺寸、落地和项目数据结构没有被改变。
- 自动测试、typecheck、lint、build、Sites worker 与真实浏览器导出验证全部通过。
