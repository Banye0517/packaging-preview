# 包装展台与排列自由组合 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增加三种可关闭、可换色、自适应真实包装尺寸的 3D 展台，并让它们与 A/B/C/D 十二种组合稳定共存且不穿模。

**Architecture:** 项目状态升级为 v19，仅保存展台模板和颜色。新的纯函数承托面求解器接收现有世界包围盒与排列语义，输出包装位置、台体几何和联合边界；`BoxScene` 只负责渲染求解结果，预览顶部控制器负责模板与颜色选择。

**Tech Stack:** React 19、TypeScript、Three.js、React Three Fiber、Vitest、Testing Library、CSS

---

## 文件结构

- Modify: `src/app/types.ts` — 新增展台枚举和 v19 项目字段。
- Modify: `src/app/projectReducer.ts` — 默认状态、展台动作和旧组合行为。
- Modify: `src/app/projectComposition.test.ts` — 展台状态与现有添加、删除、排列动作回归。
- Modify: `src/project/codec.ts` — v19 校验、v18 迁移和编码。
- Modify: `src/project/codec.test.ts` — 新状态往返、旧项目迁移和非法值拒绝。
- Create: `src/pedestal/pedestalLayout.ts` — 模板层级、承托面分配、台体自适应、碰撞检测和安全回退。
- Create: `src/pedestal/pedestalLayout.test.ts` — 十二种组合、真实尺寸、承托、防穿模和确定性测试。
- Create: `src/pedestal/PedestalStage.tsx` — 哑光物理材质台体渲染。
- Create: `src/pedestal/PedestalStage.test.tsx` — 几何、颜色和阴影属性测试。
- Create: `src/pedestal/PreviewStageToolbar.tsx` — 画幅、展台类型和颜色控制。
- Create: `src/pedestal/PreviewStageToolbar.test.tsx` — 控件与隐藏状态测试。
- Modify: `src/export/ExportFrameOverlay.tsx` — 只保留固定框和遮罩，把画幅按钮移到统一工具栏。
- Modify: `src/export/ExportFrameOverlay.test.tsx` — 固定框职责回归。
- Modify: `src/scene/BoxScene.tsx` — 消费展台求解结果、渲染台体并上报回退。
- Modify: `src/scene/BoxScene.test.tsx` — 展台渲染、联合边界和关闭恢复测试。
- Modify: `src/app/App.tsx` — 连接展台动作、工具栏和回退提示。
- Modify: `src/styles.css` — 预览顶部工具栏、色板、台面回退提示和移动端布局。

### Task 1: 增加 v19 展台项目状态

**Files:**
- Modify: `src/app/types.ts`
- Modify: `src/app/projectReducer.ts`
- Modify: `src/app/projectComposition.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
it('starts with no pedestal and preserves the selected pedestal across composition actions', () => {
  let project = createInitialProject()
  expect(project.pedestal).toEqual({ preset: 'none', color: 'warm-white' })

  project = projectReducer(project, { type: 'pedestal/preset-set', value: 'steps' })
  project = projectReducer(project, { type: 'pedestal/color-set', value: 'light-pink' })
  project = projectReducer(project, { type: 'instance/add', packagingType: 'pouch', id: 'pouch-2' })

  expect(project.pedestal).toEqual({ preset: 'steps', color: 'light-pink' })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/app/projectComposition.test.ts`

Expected: FAIL，`ProjectState` 尚无 `pedestal`，reducer 不认识新动作。

- [ ] **Step 3: 实现类型、默认值和动作**

在 `src/app/types.ts` 增加：

```ts
export type PedestalPreset = 'none' | 'steps' | 'islands' | 'horizontal'
export type PedestalColor = 'warm-white' | 'light-gray' | 'white' | 'light-yellow' | 'light-pink'

export interface PedestalState {
  preset: PedestalPreset
  color: PedestalColor
}
```

把 `ProjectState.version` 改为 `19` 并增加 `pedestal: PedestalState`。`createInitialProject()` 使用：

```ts
version: 19,
pedestal: { preset: 'none', color: 'warm-white' },
```

给 reducer action union 和 switch 增加：

```ts
case 'pedestal/preset-set':
  return { ...state, pedestal: { ...state.pedestal, preset: action.value } }
case 'pedestal/color-set':
  return { ...state, pedestal: { ...state.pedestal, color: action.value } }
```

展台设置不因添加、删除包装或切换 A/B/C/D 被重置。

- [ ] **Step 4: 运行测试并确认通过**

Run: `npm run test:run -- src/app/projectComposition.test.ts && npm run typecheck`

Expected: PASS；TypeScript 0 errors。

- [ ] **Step 5: 提交**

```bash
git add src/app/types.ts src/app/projectReducer.ts src/app/projectComposition.test.ts
git commit -m "feat: add pedestal project state"
```

### Task 2: 升级项目 codec 并迁移旧项目

**Files:**
- Modify: `src/project/codec.ts`
- Modify: `src/project/codec.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
it('round-trips version 19 pedestal settings', () => {
  const project = createInitialProject()
  project.pedestal = { preset: 'horizontal', color: 'light-yellow' }
  expect(decodeProject(encodeProject(project)).pedestal).toEqual(project.pedestal)
})

it('migrates a version 18 project with pedestals disabled', () => {
  const version18 = { ...createInitialProject(), version: 18 }
  delete (version18 as { pedestal?: unknown }).pedestal
  expect(decodeProject(JSON.stringify(version18)).pedestal).toEqual({
    preset: 'none',
    color: 'warm-white',
  })
})

it('rejects unsupported pedestal values', () => {
  const project = createInitialProject()
  ;(project.pedestal as { preset: string }).preset = 'floating'
  expect(() => decodeProject(encodeProject(project))).toThrow('不是有效的 BoxLab 项目文件')
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/project/codec.test.ts`

Expected: FAIL，v19 与展台字段未实现。

- [ ] **Step 3: 实现 v19 校验和 v18 迁移**

定义合法集合：

```ts
const PEDESTAL_PRESETS = new Set(['none', 'steps', 'islands', 'horizontal'])
const PEDESTAL_COLORS = new Set(['warm-white', 'light-gray', 'white', 'light-yellow', 'light-pink'])
```

新增 `isVersion19ProjectState()`，在现有 v18 项目校验基础上检查 `pedestal.preset` 和 `pedestal.color`。编码始终输出 `version: 19`。解码顺序先接受 v19，再把合法 v18 转成：

```ts
return {
  ...version18,
  version: 19,
  pedestal: { preset: 'none', color: 'warm-white' },
}
```

所有更老版本继续先迁移到现有组合结构，再统一补充 v19 展台默认值，不能复制一套新的旧版本迁移链。

- [ ] **Step 4: 运行 codec 全量测试**

Run: `npm run test:run -- src/project/codec.test.ts`

Expected: PASS，所有历史版本 fixture 继续通过。

- [ ] **Step 5: 提交**

```bash
git add src/project/codec.ts src/project/codec.test.ts
git commit -m "feat: persist pedestal settings"
```

### Task 3: 实现确定性的展台承托面求解器

**Files:**
- Create: `src/pedestal/pedestalLayout.ts`
- Create: `src/pedestal/pedestalLayout.test.ts`

- [ ] **Step 1: 写十二种组合与承托失败测试**

测试使用偏心、宽、深、高各不相同的六个 `LayoutBounds`，避免只验证规则立方体：

```ts
const layouts: CompositionLayout[] = ['hero', 'family', 'cluster', 'grid']
const presets: Exclude<PedestalPreset, 'none'>[] = ['steps', 'islands', 'horizontal']

it.each(layouts.flatMap((layout) => presets.map((preset) => [layout, preset] as const)))(
  'solves %s with %s without intersections',
  (layout, preset) => {
    const result = calculatePedestalLayout(items, layout, 'hero', preset)
    expect(result.fallbackReason).toBeNull()
    expect(hasPackageIntersections(result.items)).toBe(false)
    expect(hasPackagePedestalIntersections(result.items, result.pedestals)).toBe(false)
    expect(result.items.every((item) => isFullySupported(item, result.pedestals))).toBe(true)
  },
)

it('returns the existing ground layout when the pedestal is disabled', () => {
  const result = calculatePedestalLayout(items, 'cluster', 'hero', 'none')
  expect(result.pedestals).toEqual([])
  expect(result.items).toEqual(calculateCompositionLayout(items, 'cluster', 'hero').items)
})

it('is deterministic and expands platforms around large real bounds', () => {
  const first = calculatePedestalLayout(items, 'hero', 'hero', 'steps')
  const second = calculatePedestalLayout(items, 'hero', 'hero', 'steps')
  expect(first).toEqual(second)
  expect(first.pedestals.every((block) => block.width >= block.minWidth)).toBe(true)
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/pedestal/pedestalLayout.test.ts`

Expected: FAIL，求解器模块不存在。

- [ ] **Step 3: 定义输出和模板层级**

```ts
export interface PedestalBlock {
  id: string
  center: Vec3Tuple
  width: number
  height: number
  depth: number
  minWidth: number
  minDepth: number
}

export interface PedestalLayoutResult extends CompositionLayoutResult {
  pedestals: PedestalBlock[]
  fallbackReason: string | null
}

const LEVELS = {
  steps: [1.8, 1.2, 0.6, 0.6, 0, 0],
  islands: [1.45, 0.9, 0.45, 0, 0, 0],
  horizontal: [1.25, 1.25, 0.65, 0.65, 0, 0],
} as const
```

主视觉项在 `hero` 排列中先分配最高 level；其他排列保留现有 `calculateCompositionLayout` 产生的稳定顺序。对每个高于零的 level 生成一个从 `Y=0` 生长到该高度的台体。

- [ ] **Step 4: 实现自适应台体和站位**

先对每个包装的旋转后占地增加双侧安全边距 `supportMargin = max(0.12, averageHeight * 0.04)`，把膨胀后的 bounds 交给现有 A/B/C/D 平面布局，保证相邻台体也有安全距离。

每个台体尺寸使用：

```ts
width = Math.max(templateMinWidth, packageWidth + supportMargin * 2)
depth = Math.max(templateMinDepth, packageDepth + supportMargin * 2)
centerY = level / 2
```

包装 Y 位置使用 `level - rotatedBounds.min[1]`。最后对包装和台体一起计算 X/Z 中心并共同平移，联合 bounds 必须包含台体的 `[centerY - height / 2, centerY + height / 2]`。

- [ ] **Step 5: 实现碰撞、承托与回退**

导出以下真实检查函数：

```ts
export function hasPackageIntersections(items: PlacedLayoutItem[]): boolean
export function hasPackagePedestalIntersections(items: PlacedLayoutItem[], blocks: PedestalBlock[]): boolean
export function hasPedestalIntersections(blocks: PedestalBlock[]): boolean
export function isFullySupported(item: PlacedLayoutItem, blocks: PedestalBlock[]): boolean
```

包装与自身承托台只允许底面和顶面接触；与其他台体不得有 X/Y/Z 三轴体积重叠。任何检查失败时返回原 `calculateCompositionLayout`、空台体和 `fallbackReason: '展台空间不足，已恢复无展台排列'`，绝不返回穿插结果。

- [ ] **Step 6: 运行求解器测试并确认通过**

Run: `npm run test:run -- src/pedestal/pedestalLayout.test.ts src/composition/layout.test.ts`

Expected: PASS；十二种组合、关闭状态、确定性和极端尺寸均通过。

- [ ] **Step 7: 提交**

```bash
git add src/pedestal/pedestalLayout.ts src/pedestal/pedestalLayout.test.ts
git commit -m "feat: solve pedestal compositions"
```

### Task 4: 渲染真实展台几何与材质

**Files:**
- Create: `src/pedestal/PedestalStage.tsx`
- Create: `src/pedestal/PedestalStage.test.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
it('renders grounded shadow-casting blocks in the selected color', () => {
  render(<PedestalStage blocks={[block]} color="light-pink" />)
  const mesh = screen.getByTestId('pedestal-block-stage-1')
  expect(mesh).toHaveAttribute('data-bottom', '0')
  expect(mesh).toHaveAttribute('data-color', '#f3dedf')
  expect(mesh).toHaveAttribute('data-cast-shadow', 'true')
  expect(mesh).toHaveAttribute('data-receive-shadow', 'true')
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/pedestal/PedestalStage.test.tsx`

Expected: FAIL，组件不存在。

- [ ] **Step 3: 实现物理材质展台**

颜色映射固定为：

```ts
export const PEDESTAL_COLORS = {
  'warm-white': '#eee9df',
  'light-gray': '#d8dadd',
  white: '#ffffff',
  'light-yellow': '#f4e5b9',
  'light-pink': '#f3dedf',
} as const
```

每个台体渲染 `<mesh castShadow receiveShadow>` 和 `<boxGeometry args={[width, height, depth]} />`，位置直接使用求解器输出的 center。材质使用：

```tsx
<meshPhysicalMaterial color={PEDESTAL_COLORS[color]} metalness={0} roughness={0.82} clearcoat={0.04} />
```

- [ ] **Step 4: 运行组件测试**

Run: `npm run test:run -- src/pedestal/PedestalStage.test.tsx`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/pedestal/PedestalStage.tsx src/pedestal/PedestalStage.test.tsx
git commit -m "feat: render pedestal stage"
```

### Task 5: 接入 BoxScene、联合相机边界和安全回退

**Files:**
- Modify: `src/scene/BoxScene.tsx`
- Modify: `src/scene/BoxScene.test.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
it('renders pedestal blocks and lifts packages onto their support surfaces', () => {
  const project = createInitialProject()
  project.pedestal = { preset: 'steps', color: 'warm-white' }
  render(<BoxScene project={project} command={null} exportPreset={defaultExportPreset} />)
  expect(screen.getAllByTestId(/^pedestal-block-/).length).toBeGreaterThan(0)
})

it('renders no pedestal blocks when the preset is none', () => {
  render(<BoxScene project={createInitialProject()} command={null} exportPreset={defaultExportPreset} />)
  expect(screen.queryByTestId(/^pedestal-block-/)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/scene/BoxScene.test.tsx`

Expected: FAIL，场景仍只调用普通组合布局。

- [ ] **Step 3: 用展台求解结果替换场景布局来源**

`BoxScene` 使用：

```ts
const layout = useMemo(() => calculatePedestalLayout(
  visibleBounds,
  project.layout,
  project.heroInstanceId,
  project.pedestal.preset,
), [visibleBounds, project.heroInstanceId, project.layout, project.pedestal.preset])
```

在包装实例之前渲染：

```tsx
<PedestalStage blocks={layout.pedestals} color={project.pedestal.color} />
```

ContactShadows 的 `span`、`CameraControls.bounds` 和自动适配全部使用求解器的联合 bounds。透明 PNG 无需新增专用导出逻辑，因为台体已属于同一 Three.js scene。

- [ ] **Step 4: 上报求解回退状态**

给 `BoxSceneProps` 增加 `onPedestalFallback?: (message: string | null) => void`，使用 effect 在 `layout.fallbackReason` 变化时通知 App。无展台和有效求解必须上报 `null`。

- [ ] **Step 5: 运行场景、相机和导出测试**

Run: `npm run test:run -- src/scene/BoxScene.test.tsx src/scene/fitCompositionCamera.test.ts src/export/transparentPng.test.ts`

Expected: PASS；原 orbit-safe clipping 和矩形 PNG 恢复测试不回归。

- [ ] **Step 6: 提交**

```bash
git add src/scene/BoxScene.tsx src/scene/BoxScene.test.tsx
git commit -m "feat: integrate pedestal scene"
```

### Task 6: 增加预览顶部展台与颜色控制

**Files:**
- Create: `src/pedestal/PreviewStageToolbar.tsx`
- Create: `src/pedestal/PreviewStageToolbar.test.tsx`
- Modify: `src/export/ExportFrameOverlay.tsx`
- Modify: `src/export/ExportFrameOverlay.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: 写失败测试**

```tsx
it('changes pedestal preset and only shows colors while enabled', async () => {
  const user = userEvent.setup()
  const onPresetChange = vi.fn()
  const onColorChange = vi.fn()
  const baseProps = {
    exportPresetId: 'square-standard' as const,
    onExportPresetChange: vi.fn(),
    onPedestalPresetChange: onPresetChange,
    onPedestalColorChange: onColorChange,
  }
  const { rerender } = render(
    <PreviewStageToolbar
      {...baseProps}
      pedestal={{ preset: 'none', color: 'warm-white' }}
    />,
  )
  expect(screen.queryByRole('group', { name: '展台颜色' })).not.toBeInTheDocument()
  await user.selectOptions(screen.getByRole('combobox', { name: '展台类型' }), 'steps')
  expect(onPresetChange).toHaveBeenCalledWith('steps')

  rerender(<PreviewStageToolbar {...baseProps} pedestal={{ preset: 'steps', color: 'warm-white' }} />)
  await user.click(screen.getByRole('button', { name: '浅粉' }))
  expect(onColorChange).toHaveBeenCalledWith('light-pink')
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:run -- src/pedestal/PreviewStageToolbar.test.tsx`

Expected: FAIL，工具栏不存在。

- [ ] **Step 3: 拆分固定框与可点击工具栏**

`ExportFrameOverlay` 保留 ResizeObserver、四边遮罩、框线和尺寸标签，删除其中的比例按钮。`PreviewStageToolbar` 在一个可点击浮层中渲染：

```tsx
<div className="preview-stage-toolbar">
  <ExportPresetControls value={exportPresetId} onChange={onExportPresetChange} />
  <label>
    展台
    <select
      aria-label="展台类型"
      value={pedestal.preset}
      onChange={(event) => onPedestalPresetChange(event.target.value as PedestalPreset)}
    >
      <option value="none">无展台</option>
      <option value="steps">阶梯展台</option>
      <option value="islands">错落岛台</option>
      <option value="horizontal">横向层台</option>
    </select>
  </label>
  {pedestal.preset !== 'none' ? (
    <div role="group" aria-label="展台颜色">
      {PEDESTAL_COLOR_OPTIONS.map(({ value, label }) => (
        <button key={value} type="button" aria-label={label} aria-pressed={pedestal.color === value} onClick={() => onPedestalColorChange(value)} />
      ))}
    </div>
  ) : null}
</div>
```

保持固定框层 `pointer-events: none`，工具栏为 `pointer-events: auto`，不得阻断框内、框线和框外的 OrbitControls。

- [ ] **Step 4: 连接 App 项目动作和回退提示**

`App` 从 `rootProject.pedestal` 读取状态，调用：

```ts
commit({ type: 'commit', action: { type: 'pedestal/preset-set', value } })
commit({ type: 'commit', action: { type: 'pedestal/color-set', value } })
```

增加会话级 `pedestalFallback` 字符串，并把 `onPedestalFallback={setPedestalFallback}` 传给 `BoxScene`。非空时在预览顶部工具栏下显示 `role="status"`，不得用阻塞弹窗。

- [ ] **Step 5: 完成桌面和移动 CSS**

桌面工具栏居中位于预览顶部，画幅、展台和色板使用同一深色半透明容器。移动端允许工具栏换行，保持 44px 触控高度，不能遮挡底部相机按钮；色板使用带中文 `aria-label` 的圆形按钮，不能只靠颜色区分。

- [ ] **Step 6: 运行 UI 测试、typecheck 和 lint**

Run: `npm run test:run -- src/pedestal/PreviewStageToolbar.test.tsx src/export/ExportFrameOverlay.test.tsx && npm run typecheck && npm run lint`

Expected: PASS；TypeScript 与 ESLint 0 errors。

- [ ] **Step 7: 提交**

```bash
git add src/pedestal/PreviewStageToolbar.tsx src/pedestal/PreviewStageToolbar.test.tsx src/export/ExportFrameOverlay.tsx src/export/ExportFrameOverlay.test.tsx src/app/App.tsx src/styles.css
git commit -m "feat: control pedestal compositions"
```

### Task 7: 全量回归和真实浏览器验收

**Files:**
- Verify only: `src/`
- Verify only: `tests/sites-worker.test.mjs`

- [ ] **Step 1: 运行全量自动检查**

Run: `npm run test:run && npm run typecheck && npm run lint && npm run build && npm run test:sites`

Expected: 全部通过；构建保留 `dist/client/index.html`、`dist/server/index.js`、`dist/.openai/hosting.json`。

- [ ] **Step 2: 真实浏览器验证十二种组合**

在 Ego Lite 独立测试标签中创建六个大小差异明显的混合包装，逐一切换 A/B/C/D 与阶梯、岛台、横向层台：

- 所有台体从地面生长，没有悬空台体。
- 所有包装底面完整位于地面或台面。
- 包装之间、包装与台体之间无可见穿插。
- 主视觉包装在 A 排列中位于最高或核心台面。
- 切换组合后整体居中，相机包含包装与台体。
- 关闭展台后恢复原共同地面排列。

- [ ] **Step 3: 验证控制、相机和固定取景框**

在桌面和移动视口检查预览顶部工具栏不遮挡主要模型；框内、框线和框外均可旋转和缩放。切换展台会触发自动构图，完成后用户相机操作不被持续重置。

- [ ] **Step 4: 实际导出并核对**

至少导出 `800×800` 无投影、`2560×1440` 有投影和 `1440×2560` 有投影三张 PNG。用 `sips -g pixelWidth -g pixelHeight -g hasAlpha <file>` 核验尺寸与透明通道；肉眼确认台体进入 PNG、颜色正确、接收包装阴影，固定框线和 UI 不进入 PNG。

- [ ] **Step 5: 保存、打开和旧项目迁移**

保存一个 `D + 横向层台 + 浅粉` 六包装项目并重新打开，确认设置与站位稳定。再打开一个 v18 fixture，确认默认为无展台且原包装、排列、贴图和工艺数据不变。

- [ ] **Step 6: 发现问题时执行 TDD 修复循环**

任何失败先写能复现问题的自动测试，确认失败原因，再做最小修复并重复 Step 1–5，直到全部通过。

- [ ] **Step 7: 提交验收修复（仅在产生改动时）**

```bash
git add src
git commit -m "fix: finalize pedestal compositions"
```

## 完成定义

- 三种展台、五种颜色、关闭状态与 A/B/C/D 十二种组合全部可用。
- 包装和展台均使用真实尺寸，台体自适应扩大且没有三类体积穿插。
- 每个包装得到完整、确定、可验证的承托面，求解失败安全回退。
- 展台设置可保存和迁移，固定取景框、相机、PNG 导出及现有包装功能无回归。
- 自动测试、typecheck、lint、build、Sites worker 和真实浏览器验收全部通过。
