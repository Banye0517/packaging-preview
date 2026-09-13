# 一体错落展台与框外控制区 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将独立包装底座升级为带前后排防遮挡和可调圆角的一体展台，并把全部预览控制移到固定导出框外的灰色工作区。

**Architecture:** 项目状态升级为 v20，仅新增项目级展台圆角。纯函数求解器先生成前后排和连续底座，再用默认导出相机投影检测后排可见面积；框外工具轨道与导出框共享同一个布局结果，Three.js 场景只消费最终确定的站位和圆角几何。

**Tech Stack:** React 19、TypeScript、Three.js、React Three Fiber、Vitest、Testing Library、CSS

---

## 文件结构

- Modify: `src/app/types.ts` — v20 和展台圆角状态。
- Modify: `src/app/projectReducer.ts` — 默认圆角及 reducer action。
- Modify: `src/app/projectComposition.test.ts` — 圆角状态和撤销历史回归。
- Modify: `src/project/codec.ts` — v19 → v20 迁移和圆角校验。
- Modify: `src/project/codec.test.ts` — 迁移、往返和非法值测试。
- Modify: `src/pedestal/pedestalLayout.ts` — 前后排、一体底座、连续高台和安全求解。
- Modify: `src/pedestal/pedestalLayout.test.ts` — 一体性、承托、层级和 12 种组合测试。
- Create: `src/pedestal/projectedVisibility.ts` — 默认相机下屏幕投影与遮挡面积计算。
- Create: `src/pedestal/projectedVisibility.test.ts` — 后排 80% 可见阈值测试。
- Create: `src/pedestal/RoundedPedestalBlock.tsx` — 有平整顶面的圆角台体几何。
- Create: `src/pedestal/RoundedPedestalBlock.test.tsx` — 圆角钳制和几何参数测试。
- Modify: `src/pedestal/PedestalStage.tsx` — 渲染连续底座和圆角台体。
- Modify: `src/pedestal/PedestalStage.test.tsx` — 圆角、阴影和材质测试。
- Modify: `src/export/exportFrame.ts` — 同时计算导出框与框外工具轨道。
- Modify: `src/export/exportFrame.test.ts` — 三种比例、不重叠和投影一致性测试。
- Create: `src/export/PreviewStageToolbar.tsx` — 统一画幅、展台、颜色、圆角和相机按钮。
- Create: `src/export/PreviewStageToolbar.test.tsx` — 控件行为和可访问性测试。
- Modify: `src/export/ExportFrameOverlay.tsx` — 只绘制框和遮罩。
- Modify: `src/export/ExportFrameOverlay.test.tsx` — 纯 overlay 职责测试。
- Modify: `src/scene/PreviewControls.tsx` — 删除独立浮层或变成工具栏复用按钮。
- Modify: `src/scene/BoxScene.tsx` — 传入默认相机约束与展台圆角。
- Modify: `src/scene/BoxScene.test.tsx` — 联合边界和相机不跳动测试。
- Modify: `src/app/App.tsx` — 连接 v20 actions、统一工具栏和回退提示。
- Modify: `src/styles.css` — 灰色工具轨道、桌面/竖版/移动布局。

### Task 1: 增加 v20 展台圆角状态

**Files:**
- Modify: `src/app/types.ts`
- Modify: `src/app/projectReducer.ts`
- Modify: `src/app/projectComposition.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
it('stores a clamped project-level pedestal radius', () => {
  let project = createInitialProject()
  expect(project.pedestal.cornerRadiusMm).toBe(8)

  project = projectReducer(project, { type: 'pedestal/radius-set', value: 24 })
  expect(project.pedestal.cornerRadiusMm).toBe(24)

  project = projectReducer(project, { type: 'pedestal/radius-set', value: 80 })
  expect(project.pedestal.cornerRadiusMm).toBe(30)
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- --run src/app/projectComposition.test.ts`

Expected: FAIL，`cornerRadiusMm` 与 `pedestal/radius-set` 尚不存在。

- [ ] **Step 3: 实现类型和 reducer**

把项目版本升级为 20：

```ts
export interface PedestalState {
  preset: PedestalPreset
  color: PedestalColor
  cornerRadiusMm: number
}

export interface ProjectState {
  version: 20
  // existing fields remain unchanged
}
```

默认状态和 action：

```ts
pedestal: { preset: 'none', color: 'warm-white', cornerRadiusMm: 8 }

| { type: 'pedestal/radius-set'; value: number }

case 'pedestal/radius-set':
  return {
    ...state,
    pedestal: {
      ...state.pedestal,
      cornerRadiusMm: Math.min(30, Math.max(0, Number.isFinite(action.value) ? action.value : 8)),
    },
  }
```

- [ ] **Step 4: 运行测试与类型检查**

Run: `npm test -- --run src/app/projectComposition.test.ts && npm run typecheck`

Expected: PASS；TypeScript 0 errors。

- [ ] **Step 5: 提交**

```bash
git add src/app/types.ts src/app/projectReducer.ts src/app/projectComposition.test.ts
git commit -m "feat: add pedestal radius state"
```

### Task 2: 迁移 v19 项目并校验圆角

**Files:**
- Modify: `src/project/codec.ts`
- Modify: `src/project/codec.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
it('migrates version 19 pedestal state with the default radius', () => {
  const project = createInitialProject()
  const version19 = { ...project, version: 19, pedestal: { preset: 'steps', color: 'light-pink' } }
  expect(decodeProject(JSON.stringify(version19)).pedestal).toEqual({
    preset: 'steps', color: 'light-pink', cornerRadiusMm: 8,
  })
})

it.each([-1, 31, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid radius %s', (value) => {
  const project = createInitialProject()
  project.pedestal.cornerRadiusMm = value
  expect(() => decodeProject(JSON.stringify(project))).toThrow('不是有效的 BoxLab 项目文件')
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- --run src/project/codec.test.ts`

Expected: FAIL，codec 仍只接受 v19。

- [ ] **Step 3: 实现 v20 校验与 v19 迁移**

```ts
function isValidPedestalRadius(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 30
}

function migrateVersion19(project: Version19ProjectState): ProjectState {
  return {
    ...project,
    version: 20,
    pedestal: { ...project.pedestal, cornerRadiusMm: 8 },
  }
}
```

解码顺序固定为 v20 → v19 → 旧迁移链。v19 必须保留其展台类型和颜色，不能重置为无展台。

- [ ] **Step 4: 运行 codec 测试**

Run: `npm test -- --run src/project/codec.test.ts && npm run typecheck`

Expected: PASS，全部历史项目 fixture 继续通过。

- [ ] **Step 5: 提交**

```bash
git add src/project/codec.ts src/project/codec.test.ts
git commit -m "feat: migrate pedestal radius projects"
```

### Task 3: 生成前后排和连续底座

**Files:**
- Modify: `src/pedestal/pedestalLayout.ts`
- Modify: `src/pedestal/pedestalLayout.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
it.each(layouts.flatMap((layout) => presets.map((preset) => [layout, preset] as const)))(
  'builds one grounded base for %s and %s',
  (layout, preset) => {
    const result = calculatePedestalLayout(items, layout, 'hero', preset)
    const base = result.pedestals.find((block) => block.role === 'base')
    expect(base).toBeDefined()
    expect(base!.center[1] - base!.height / 2).toBeCloseTo(0)
    expect(result.pedestals.filter((block) => block.role === 'base')).toHaveLength(1)
    expect(result.items.every((item) => isFullySupported(item, result.pedestals))).toBe(true)
  },
)

it('always raises rear supports above front supports', () => {
  const result = calculatePedestalLayout(items, 'grid', 'hero', 'steps')
  const frontHeight = Math.max(...result.supports.filter((item) => item.row === 'front').map((item) => item.height))
  const rearHeight = Math.min(...result.supports.filter((item) => item.row === 'rear').map((item) => item.height))
  expect(rearHeight).toBeGreaterThan(frontHeight)
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- --run src/pedestal/pedestalLayout.test.ts`

Expected: FAIL，当前每个包装拥有独立台体，且没有 `role`、`supports` 或前后排。

- [ ] **Step 3: 扩展求解器数据结构**

```ts
export interface PedestalBlock {
  id: string
  role: 'base' | 'riser'
  center: Vec3Tuple
  width: number
  height: number
  depth: number
  minWidth: number
  minDepth: number
}

export interface PackageSupport {
  packageId: string
  blockId: string
  row: 'front' | 'rear'
  height: number
}

export interface PedestalLayoutResult extends CompositionLayoutResult {
  pedestals: PedestalBlock[]
  supports: PackageSupport[]
  fallbackReason: string | null
}
```

- [ ] **Step 4: 用一个底座连接全部承托面**

先从最终包装占地的联合 X/Z 边界生成一个 `role: 'base'` 台体。前排包装落在底座顶面；后排高台使用 `role: 'riser'`，其底面与底座顶面接触，不能从地面重复穿过底座。碰撞函数允许 base/riser 共享接触面，但禁止体积重叠和共面外表面。

```ts
const base: PedestalBlock = {
  id: 'pedestal-base',
  role: 'base',
  center: [centerX, BASE_HEIGHT / 2, centerZ],
  width: maxX - minX + margin * 2,
  height: BASE_HEIGHT,
  depth: maxZ - minZ + margin * 2,
  minWidth: MIN_WIDTH,
  minDepth: MIN_DEPTH,
}
```

三种模板只改变 rear row 的高台轮廓和分组，不再为每个包装生成落地小底座。

- [ ] **Step 5: 运行 12 种组合和碰撞测试**

Run: `npm test -- --run src/pedestal/pedestalLayout.test.ts`

Expected: PASS；12 种组合都有且只有一个落地 base，无包装悬空或穿模。

- [ ] **Step 6: 提交**

```bash
git add src/pedestal/pedestalLayout.ts src/pedestal/pedestalLayout.test.ts
git commit -m "feat: build integrated pedestal layouts"
```

### Task 4: 默认相机投影防遮挡

**Files:**
- Create: `src/pedestal/projectedVisibility.ts`
- Create: `src/pedestal/projectedVisibility.test.ts`
- Modify: `src/pedestal/pedestalLayout.ts`
- Modify: `src/pedestal/pedestalLayout.test.ts`

- [ ] **Step 1: 写投影面积失败测试**

```ts
it('reports the visible fraction after front rectangles cover a rear rectangle', () => {
  const rear = { left: 0, top: 0, right: 100, bottom: 100 }
  const front = [{ left: 0, top: 80, right: 100, bottom: 100 }]
  expect(calculateVisibleFraction(rear, front)).toBeCloseTo(0.8)
})

it('raises or shifts a rear package until at least 80 percent remains visible', () => {
  const result = solveRearVisibility(overlappingFixture, DEFAULT_EXPORT_VIEW)
  expect(result.rearVisibleFraction).toBeGreaterThanOrEqual(0.8)
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- --run src/pedestal/projectedVisibility.test.ts`

Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现相机基向量和矩形投影**

`projectWorldBounds()` 使用与 `fitCompositionCamera` 相同的 `position`、`target`、FOV 和导出宽高比，把 8 个世界包围盒角投影成归一化二维矩形。`calculateVisibleFraction()` 计算 rear rect 减去 front rect union 后的面积比例，不能简单相加重叠面积。

```ts
export interface ScreenRect { left: number; top: number; right: number; bottom: number }
export const MIN_REAR_VISIBLE_FRACTION = 0.8

export function calculateVisibleFraction(rear: ScreenRect, occluders: ScreenRect[]): number
export function projectWorldBounds(bounds: WorldBounds, camera: ProjectionCamera): ScreenRect
```

- [ ] **Step 4: 在展台求解器中做有界修正**

每个后排包装最多执行 12 次确定性候选：先逐级增加高台高度，再按左、右交替增加 X 偏移。每次候选都重新检查世界空间碰撞。达到 80% 即停止；无候选满足则安全回退，不能无限抬高。

```ts
const HEIGHT_STEP = Math.max(0.12, averageHeight * 0.08)
const X_SHIFT_STEP = Math.max(gap, averageWidth * 0.08)
const MAX_VISIBILITY_ATTEMPTS = 12
```

- [ ] **Step 5: 验证可见性、确定性和相机不参与后续 orbit**

Run: `npm test -- --run src/pedestal/projectedVisibility.test.ts src/pedestal/pedestalLayout.test.ts`

Expected: PASS；同一输入输出完全相同，后排可见面积至少 80%。

- [ ] **Step 6: 提交**

```bash
git add src/pedestal/projectedVisibility.ts src/pedestal/projectedVisibility.test.ts src/pedestal/pedestalLayout.ts src/pedestal/pedestalLayout.test.ts
git commit -m "feat: prevent rear package occlusion"
```

### Task 5: 渲染安全圆角的一体台体

**Files:**
- Create: `src/pedestal/RoundedPedestalBlock.tsx`
- Create: `src/pedestal/RoundedPedestalBlock.test.tsx`
- Modify: `src/pedestal/PedestalStage.tsx`
- Modify: `src/pedestal/PedestalStage.test.tsx`
- Modify: `src/scene/BoxScene.tsx`

- [ ] **Step 1: 写圆角钳制失败测试**

```ts
it.each([
  [{ width: 4, height: 1, depth: 3, radius: 0.4 }, 0.4],
  [{ width: 1, height: 0.3, depth: 1, radius: 0.4 }, 0.149],
])('clamps radius while keeping a flat top', (input, expected) => {
  const result = getSafePedestalGeometry(input)
  expect(result.radius).toBeCloseTo(expected, 2)
  expect(result.flatTopWidth).toBeGreaterThan(0)
  expect(result.flatTopDepth).toBeGreaterThan(0)
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- --run src/pedestal/RoundedPedestalBlock.test.tsx`

Expected: FAIL，组件和安全钳制函数不存在。

- [ ] **Step 3: 实现圆角台体**

使用 Three.js `RoundedBoxGeometry` 或项目内等价 BufferGeometry。毫米值按包装模型的既有比例 `3.6 / 220` 转为世界单位，并钳制为：

```ts
const radiusWorld = radiusMm * (3.6 / 220)
const safeRadius = Math.max(0, Math.min(
  radiusWorld,
  width / 2 - 1e-3,
  depth / 2 - 1e-3,
  height / 2 - 1e-3,
))
```

几何顶面必须包含覆盖包装底面和安全边距的平面区域；圆角只作用外轮廓，不改变台体的世界包围盒。

- [ ] **Step 4: 连接场景状态**

```tsx
<PedestalStage
  blocks={layout.pedestals}
  color={project.pedestal.color}
  cornerRadiusMm={project.pedestal.cornerRadiusMm}
/>
```

底座和 riser 使用同一材质、圆角和阴影规则。相接的 riser 底面不得出现可见 Z-fighting。

- [ ] **Step 5: 运行组件和场景测试**

Run: `npm test -- --run src/pedestal/RoundedPedestalBlock.test.tsx src/pedestal/PedestalStage.test.tsx src/scene/BoxScene.test.tsx`

Expected: PASS，无 R3F 非法 DOM/data 属性进入 Three.js 实例。

- [ ] **Step 6: 提交**

```bash
git add src/pedestal/RoundedPedestalBlock.tsx src/pedestal/RoundedPedestalBlock.test.tsx src/pedestal/PedestalStage.tsx src/pedestal/PedestalStage.test.tsx src/scene/BoxScene.tsx
git commit -m "feat: render rounded integrated pedestals"
```

### Task 6: 计算框外灰色工具轨道

**Files:**
- Modify: `src/export/exportFrame.ts`
- Modify: `src/export/exportFrame.test.ts`

- [ ] **Step 1: 写三种比例失败测试**

```ts
it.each(['square-standard', 'landscape-2k', 'portrait-2k'] as const)(
  'keeps toolbar rails outside %s frame',
  (presetId) => {
    const layout = calculatePreviewStageLayout(1120, 820, getExportPreset(presetId))
    expect(rectsOverlap(layout.frame, layout.primaryToolbar)).toBe(false)
    expect(rectsOverlap(layout.frame, layout.cameraToolbar)).toBe(false)
    expect(layout.frame.width / layout.frame.height).toBeCloseTo(
      getExportPreset(presetId).width / getExportPreset(presetId).height,
    )
  },
)
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- --run src/export/exportFrame.test.ts`

Expected: FAIL，`calculatePreviewStageLayout` 不存在。

- [ ] **Step 3: 实现共享布局结果**

```ts
export interface PreviewStageLayout {
  frame: ExportFrameRect
  primaryToolbar: ExportFrameRect
  cameraToolbar: ExportFrameRect
  placement: 'horizontal-rails' | 'portrait-side-rail' | 'mobile-stacked'
}

export function calculatePreviewStageLayout(
  viewportWidth: number,
  viewportHeight: number,
  preset: ExportPreset,
): PreviewStageLayout
```

桌面横向/方形预留上方 `96 px`、下方 `56 px`；竖版优先预留右侧 `188 px`。移动端使用上下堆叠并确保每个控制按钮 `44 px`。所有矩形保持至少 `8 px` 间距。

- [ ] **Step 4: 让相机投影复用同一个 frame**

`applyExportFrameProjection()` 必须调用 `calculatePreviewStageLayout()` 并使用其 `frame.height`，避免视觉框与相机 projection 各算一套 padding。

- [ ] **Step 5: 运行导出框测试**

Run: `npm test -- --run src/export/exportFrame.test.ts`

Expected: PASS，三种比例及桌面/移动代表尺寸无交叠。

- [ ] **Step 6: 提交**

```bash
git add src/export/exportFrame.ts src/export/exportFrame.test.ts
git commit -m "feat: reserve export frame tool rails"
```

### Task 7: 统一框外工具栏

**Files:**
- Create: `src/export/PreviewStageToolbar.tsx`
- Create: `src/export/PreviewStageToolbar.test.tsx`
- Modify: `src/export/ExportFrameOverlay.tsx`
- Modify: `src/export/ExportFrameOverlay.test.tsx`
- Modify: `src/scene/PreviewControls.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: 写交互失败测试**

```tsx
it('edits frame, pedestal, color, radius and camera from one outside toolbar', async () => {
  render(<PreviewStageToolbar {...props} />)
  await user.click(screen.getByRole('button', { name: '16:9' }))
  await user.click(screen.getByRole('button', { name: '阶梯展台' }))
  await user.click(screen.getByRole('button', { name: '浅粉' }))
  fireEvent.change(screen.getByRole('slider', { name: '展台圆角' }), { target: { value: '18' } })
  await user.click(screen.getByRole('button', { name: '适合视图' }))
  expect(props.onExportPresetChange).toHaveBeenCalledWith('landscape-2k')
  expect(props.onPedestalPresetChange).toHaveBeenCalledWith('steps')
  expect(props.onPedestalColorChange).toHaveBeenCalledWith('light-pink')
  expect(props.onRadiusChange).toHaveBeenCalled()
  expect(props.onCameraCommand).toHaveBeenCalledWith('fit')
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- --run src/export/PreviewStageToolbar.test.tsx`

Expected: FAIL，统一工具栏不存在。

- [ ] **Step 3: 拆分职责**

`ExportFrameOverlay` 只接收 `frame` 并渲染遮罩、边框和尺寸标签。`PreviewStageToolbar` 接收 `PreviewStageLayout`，用 `primaryToolbar` 和 `cameraToolbar` 的矩形通过 inline style 定位，所有输入继续 dispatch 到现有 history。

圆角控件：

```tsx
<label className="pedestal-radius-control">
  <span>圆角 {pedestal.cornerRadiusMm} mm</span>
  <input
    aria-label="展台圆角"
    type="range"
    min={0}
    max={30}
    step={1}
    value={pedestal.cornerRadiusMm}
    onChange={(event) => onRadiusChange(Number(event.currentTarget.value))}
  />
</label>
```

- [ ] **Step 4: 删除旧浮动控制层**

`App` 不再单独渲染 `PreviewControls`，`ExportFrameOverlay` 不再包含比例/展台按钮。保留四个右侧设置区不变。回退提示定位在工具轨道内，不能覆盖 frame。

- [ ] **Step 5: 添加响应式 CSS**

工具栏必须使用布局器给出的矩形；CSS 只负责内部 flex/wrap 和视觉样式。移动端按钮 `min-height: 44px`，色板 `44px × 44px`。禁止重新写死 `top: 16px` 或 `top: 58px` 覆盖布局器。

- [ ] **Step 6: 运行 UI 与 App 测试**

Run: `npm test -- --run src/export/PreviewStageToolbar.test.tsx src/export/ExportFrameOverlay.test.tsx src/app/App.test.tsx`

Expected: PASS，固定框内无交互控件。

- [ ] **Step 7: 提交**

```bash
git add src/export/PreviewStageToolbar.tsx src/export/PreviewStageToolbar.test.tsx src/export/ExportFrameOverlay.tsx src/export/ExportFrameOverlay.test.tsx src/scene/PreviewControls.tsx src/app/App.tsx src/styles.css
git commit -m "feat: move preview controls outside export frame"
```

### Task 8: 全量验证与真实浏览器验收

**Files:**
- Verify: `src/`
- Verify: `tests/sites-worker.test.mjs`
- Verify: `dist/client/index.html`
- Verify: `dist/server/index.js`
- Verify: `dist/.openai/hosting.json`

- [ ] **Step 1: 运行静态与自动检查**

Run: `npm run typecheck && npm run lint && npm test -- --run`

Expected: 0 errors，全部测试通过。

- [ ] **Step 2: 构建 Sites 交付物**

Run: `npm run build && npm run test:sites`

Expected: `dist/client/index.html`、`dist/server/index.js`、`dist/.openai/hosting.json` 存在；Sites tests 全部通过。允许保留当前已知的大 chunk warning，但不能出现 build error。

- [ ] **Step 3: 启动并打开本地预览**

Run: `npm run dev -- --host 127.0.0.1`

使用 Ego Lite 新建独立本地测试页，不占用用户已有页面。记录实际端口。

- [ ] **Step 4: 验证代表性场景**

分别建立：

- 1 个盒装、圆角 0 mm。
- 2 个不同包装、阶梯展台、圆角 8 mm。
- 4 个混合包装、C 错落、浅粉岛台、圆角 18 mm。
- 6 个混合包装、D 阵列、浅灰横向台、圆角 30 mm。

每个场景检查：一个连续底座、后排更高、后排可见、无穿插、全部承托、切换相机后物体不跳动。

- [ ] **Step 5: 验证框外控制和实际导出**

在 1:1、16:9、9:16 下检查全部按钮与尺寸标签不覆盖白色 frame。每种比例至少导出一张有投影 PNG，使用图片查看器核对尺寸、完整构图、颜色、圆角和阴影。

- [ ] **Step 6: 代码审查**

使用 `requesting-code-review` 派发只读审查。修复全部 Critical 和 Important，再重复相关测试与浏览器验收。

- [ ] **Step 7: 最终提交**

```bash
git add src/app/types.ts src/app/projectReducer.ts src/app/projectComposition.test.ts src/project/codec.ts src/project/codec.test.ts src/pedestal src/export src/scene/BoxScene.tsx src/scene/BoxScene.test.tsx src/scene/PreviewControls.tsx src/app/App.tsx src/styles.css
git commit -m "feat: refine integrated pedestal staging"
```

确认无关的 `.superpowers/brainstorm/` 和旧的未跟踪文档没有进入提交。
