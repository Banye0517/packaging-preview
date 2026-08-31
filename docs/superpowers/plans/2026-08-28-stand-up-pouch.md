# BoxLab Stand-up Pouch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变现有六面盒型行为的前提下，新增可上传正背面、使用固定白色风琴底、可调袋体厚度、四角圆角和互斥封口结构的三边封自立袋。

**Architecture:** `ProjectState` 同时保存盒型和自立袋两套状态，由 `packagingType` 决定当前面板与 Three.js 模型。自立袋几何拆成可测试的正背片、圆弧截面三边封边、固定白色底部风琴、拉链和居中吸嘴；袋体厚度独立控制正背片距离与三边封边深度。

**Tech Stack:** React 19、TypeScript 6、React Three Fiber、Three.js、Vitest、Testing Library、Vite。

---

## 文件结构

- 修改 `src/app/types.ts`：定义包装类型、自立袋状态和项目版本 2。
- 修改 `src/app/projectReducer.ts`、`src/app/projectReducer.test.ts`：新增自立袋动作与默认值。
- 修改 `src/project/codec.ts`、`src/project/codec.test.ts`：验证 version 2，并迁移 version 1。
- 创建 `src/pouch/pouchGeometry.ts`、`src/pouch/pouchGeometry.test.ts`：生成三边封袋体几何。
- 创建 `src/pouch/PrintedPouch.tsx`：装配袋体、贴图、封边、拉链和吸嘴材质。
- 创建 `src/pouch/PouchPanel.tsx`、`src/pouch/PouchPanel.test.tsx`：袋体尺寸、圆角、封口和底色控件。
- 创建 `src/artwork/PouchArtworkGrid.tsx`、`src/artwork/PouchArtworkGrid.test.tsx`：只提供正背面上传。
- 修改 `src/scene/BoxScene.tsx`：升级为可切换盒体/袋体的包装场景，保留导出与相机。
- 修改 `src/app/App.tsx`、`src/app/App.test.tsx`：连接类型切换、上传和两套状态。
- 修改 `src/styles.css`：新增类型选择器、封口单选和袋体厚度的响应式样式。
- 修改 `PRD.md`、`Tech-Spec.md`、`acceptance-matrix.md`：同步已实现功能合同。

> 当前目录没有 `.git`，因此本计划不包含不可执行的 `git commit`。每个任务以定向测试通过作为可恢复检查点；若执行前恢复 Git 仓库，再按任务边界分别提交。

### Task 1: 建立基线并升级项目状态

**Files:**
- Modify: `src/app/types.ts`
- Modify: `src/app/projectReducer.ts`
- Test: `src/app/projectReducer.test.ts`

- [ ] **Step 1: 运行现有基线**

Run: `npm run test:run && npm run typecheck`

Expected: 当前测试与类型检查全部通过；若失败，先记录现有失败，不把它归因于自立袋改动。

- [ ] **Step 2: 写失败测试，锁定两套独立状态**

在 `src/app/projectReducer.test.ts` 增加：

```ts
it('keeps box and pouch state independently while switching type', () => {
  const initial = createInitialProject()
  const pouch = projectReducer(initial, { type: 'packaging/type', value: 'pouch' })
  const changed = projectReducer(pouch, {
    type: 'pouch/set',
    key: 'thickness',
    value: 18,
  })
  const box = projectReducer(changed, { type: 'packaging/type', value: 'box' })

  expect(box.packagingType).toBe('box')
  expect(box.box).toEqual(initial.box)
  expect(box.pouch.thickness).toBe(18)
})

it('keeps closure states mutually exclusive', () => {
  const state = projectReducer(createInitialProject(), {
    type: 'pouch/set',
    key: 'closure',
    value: 'spout',
  })

  expect(state.pouch.closure).toBe('spout')
})
```

- [ ] **Step 3: 运行测试并确认失败**

Run: `npm run test:run -- src/app/projectReducer.test.ts`

Expected: FAIL，提示 `packagingType`、`pouch` 或新动作不存在。

- [ ] **Step 4: 实现版本 2 状态合同**

在 `src/app/types.ts` 定义：

```ts
export type PackagingType = 'box' | 'pouch'
export type PouchFace = 'front' | 'back'
export type PouchClosure = 'none' | 'zipper' | 'spout'

export interface PouchState {
  faces: Record<PouchFace, ArtworkAsset | null>
  width: number
  height: number
  thickness: number
  gussetDepth: number
  roundedCorners: boolean
  closure: PouchClosure
}

export interface ProjectState {
  version: 2
  name: string
  activeTab: 'artwork' | 'finish' | 'box' | 'camera'
  packagingType: PackagingType
  faces: Record<BoxFace, ArtworkAsset | null>
  box: { width: number; height: number; depth: number; radius: number }
  pouch: PouchState
  camera: { autoRotate: boolean }
}
```

在 `createInitialProject()` 中加入：

```ts
version: 2,
packagingType: 'box',
pouch: {
  faces: { front: null, back: null },
  width: 160,
  height: 240,
  thickness: 16,
  gussetDepth: 70,
  roundedCorners: true,
  closure: 'none',
},
```

扩展动作：

```ts
| { type: 'packaging/type'; value: PackagingType }
| { type: 'pouch/face-set'; face: PouchFace; asset: ArtworkAsset }
| { type: 'pouch/face-remove'; face: PouchFace }
| { type: 'pouch/set'; key: keyof Omit<PouchState, 'faces'>; value: number | boolean | string }
```

Reducer 必须只更新目标分支，遇到非有限或非正数尺寸时返回原状态。

- [ ] **Step 5: 运行定向测试**

Run: `npm run test:run -- src/app/projectReducer.test.ts`

Expected: PASS。

### Task 2: 兼容旧项目文件

**Files:**
- Modify: `src/project/codec.ts`
- Test: `src/project/codec.test.ts`

- [ ] **Step 1: 写 version 1 迁移失败测试**

```ts
it('migrates a version 1 project to a version 2 box project', () => {
  const legacy = {
    ...createInitialProject(),
    version: 1,
    packagingType: undefined,
    pouch: undefined,
  }
  const source = JSON.stringify(legacy, (key, value) =>
    value === undefined ? undefined : value,
  )

  const decoded = decodeProject(source)
  expect(decoded.version).toBe(2)
  expect(decoded.packagingType).toBe('box')
  expect(decoded.pouch.faces).toEqual({ front: null, back: null })
})
```

- [ ] **Step 2: 确认失败**

Run: `npm run test:run -- src/project/codec.test.ts`

Expected: FAIL，旧文件当前只能作为 version 1 原样返回或被新版类型拒绝。

- [ ] **Step 3: 实现显式迁移与严格验证**

保留现有 `isArtworkAsset()`，新增 `isLegacyProjectState()`、`isPouchState()`、`isProjectStateV2()`。`decodeProject()` 使用以下分支：

```ts
const value: unknown = JSON.parse(source)
if (isProjectStateV2(value)) return value
if (isLegacyProjectState(value)) {
  const initial = createInitialProject()
  return {
    ...initial,
    name: value.name,
    activeTab: value.activeTab,
    faces: value.faces,
    box: value.box,
    camera: value.camera,
  }
}
throw new Error('不是有效的 BoxLab 项目文件')
```

验证封口必须属于 `none/zipper/spout`，全部尺寸必须为正有限数。

- [ ] **Step 4: 运行 codec 与 reducer 测试**

Run: `npm run test:run -- src/project/codec.test.ts src/app/projectReducer.test.ts`

Expected: PASS，外部纹理 URL 仍被拒绝。

### Task 3: 新增两面上传

**Files:**
- Create: `src/artwork/PouchArtworkGrid.tsx`
- Create: `src/artwork/PouchArtworkGrid.test.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
it('renders exactly two pouch uploads', () => {
  render(<PouchArtworkGrid
    faces={{ front: null, back: null }}
    errors={{}}
    onUpload={vi.fn()}
    onRemove={vi.fn()}
  />)

  expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(2)
  expect(screen.queryByLabelText('上传左侧印刷图')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('上传底部印刷图')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: 确认失败**

Run: `npm run test:run -- src/artwork/PouchArtworkGrid.test.tsx`

Expected: FAIL，组件不存在。

- [ ] **Step 3: 实现组件**

`PouchArtworkGrid` 固定渲染 `front/正面` 与 `back/背面`，直接复用现有 `FaceUploader`。不增加侧面、底面、颜色或取色入口。

- [ ] **Step 4: 运行上传组件测试**

Run: `npm run test:run -- src/artwork/PouchArtworkGrid.test.tsx src/artwork/FaceGrid.test.tsx`

Expected: PASS，现有六面上传测试不变。

### Task 4: 实现袋型设置面板

**Files:**
- Create: `src/pouch/PouchPanel.tsx`
- Create: `src/pouch/PouchPanel.test.tsx`
- Modify: `src/box/BoxPanel.tsx`

- [ ] **Step 1: 写失败测试**

```tsx
it('offers thickness, rounded corners and mutually exclusive closures', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<PouchPanel pouch={createInitialProject().pouch} onChange={onChange} />)

  expect(screen.getAllByRole('radio')).toHaveLength(3)
  await user.click(screen.getByRole('radio', { name: '顶部居中吸嘴' }))
  expect(onChange).toHaveBeenCalledWith('closure', 'spout')
  expect(screen.getByLabelText('四角圆角')).toBeChecked()
  expect(screen.getByRole('spinbutton', { name: '袋体厚度（毫米）' })).toHaveValue(16)
})
```

- [ ] **Step 2: 确认失败**

Run: `npm run test:run -- src/pouch/PouchPanel.test.tsx`

Expected: FAIL，组件不存在。

- [ ] **Step 3: 实现面板和类型切换器**

`PouchPanel` 渲染袋宽、袋高、袋体厚度、底部展开深度四个数值输入，一个四角圆角 checkbox 和三个同名 closure radio。袋体厚度必须为正数并独立于底部展开深度。

`BoxPanel` 顶部新增由父组件控制的类型单选：

```ts
packagingType: PackagingType
onPackagingTypeChange: (value: PackagingType) => void
```

保持原四个盒体数值输入和标签不变。

- [ ] **Step 4: 运行面板测试**

Run: `npm run test:run -- src/pouch/PouchPanel.test.tsx src/app/App.test.tsx`

Expected: 新测试 PASS；App 测试可能因尚未接线继续 FAIL，记录为下一任务输入。

### Task 5: 用 TDD 建立三边封袋体几何

**Files:**
- Create: `src/pouch/pouchGeometry.ts`
- Create: `src/pouch/pouchGeometry.test.ts`

- [ ] **Step 1: 写结构失败测试**

```ts
it('creates only front, back, three sealed edges and an open gusset bottom', () => {
  const parts = createPouchGeometry({
    width: 160,
    height: 240,
    thickness: 16,
    gussetDepth: 70,
    roundedCorners: true,
  })

  expect(Object.keys(parts).sort()).toEqual([
    'back', 'front', 'gusset', 'leftSeal', 'rightSeal', 'topSeal',
  ])
  expect(parts.gusset.userData.role).toBe('open-bottom-gusset')
  expect(parts.leftSeal.userData.crossSection).toBe('rounded-bridge')
  expect(parts.rightSeal.userData.crossSection).toBe('rounded-bridge')
  expect(parts.topSeal.userData.crossSection).toBe('rounded-bridge')
  expect(parts.leftSeal.userData.printable).toBe(false)
  expect(parts.rightSeal.userData.printable).toBe(false)
})

it('changes all four outline corners without closing the gusset', () => {
  const square = samplePouchOutline({ width: 160, height: 240, roundedCorners: false })
  const rounded = samplePouchOutline({ width: 160, height: 240, roundedCorners: true })
  expect(rounded).not.toEqual(square)
  expect(rounded.filter((point) => point.cornerArc).length).toBeGreaterThanOrEqual(8)
})
```

- [ ] **Step 2: 确认失败**

Run: `npm run test:run -- src/pouch/pouchGeometry.test.ts`

Expected: FAIL，几何模块不存在。

- [ ] **Step 3: 实现稳定参数化几何**

`pouchGeometry.ts` 导出：

```ts
export interface PouchGeometryOptions {
  width: number
  height: number
  thickness: number
  gussetDepth: number
  roundedCorners: boolean
}

export interface PouchGeometryParts {
  front: BufferGeometry
  back: BufferGeometry
  leftSeal: BufferGeometry
  rightSeal: BufferGeometry
  topSeal: BufferGeometry
  gusset: BufferGeometry
}

export function samplePouchOutline(options: Pick<PouchGeometryOptions,
  'width' | 'height' | 'roundedCorners'>): PouchOutlinePoint[]

export function createPouchGeometry(options: PouchGeometryOptions): PouchGeometryParts
```

坐标约定：袋高归一化为 `3.2` 场景单位；正面朝 `+Z`，背面朝 `-Z`；正背片距离严格来自 `thickness`，底部逐渐展开至完整 `gussetDepth`。正背片使用同一 UV 合同 `[0,1] × [0,1]`，背面顶点顺序反转以保持图片正向。左右和顶部封边沿 Z 方向使用至少 5 个截面采样点形成半圆/胶囊形圆弧 bridge，连续连接正背片，不能用两张共面的 ribbon 代替；风琴底使用两片向内折线汇合的白色曲面，不把底部加入封边 perimeter。

为每个 geometry 设置 `userData.role` 与 `userData.printable`，并计算 normals 和 bounding box，方便测试尺寸与站立平面。

- [ ] **Step 4: 运行几何测试**

Run: `npm run test:run -- src/pouch/pouchGeometry.test.ts`

Expected: PASS；`gusset.boundingBox.min.y` 与 `max.y` 的最低点形成稳定站立平面，且不存在 `bottomSeal`。

### Task 6: 装配贴图、拉链与居中吸嘴

**Files:**
- Create: `src/pouch/PrintedPouch.tsx`
- Modify: `src/scene/BoxScene.tsx`
- Test: `src/pouch/pouchGeometry.test.ts`

- [ ] **Step 1: 增加附件结构测试**

```ts
it('describes mutually exclusive closure attachments', () => {
  expect(getPouchClosureParts('none')).toEqual([])
  expect(getPouchClosureParts('zipper')).toEqual(['zipper-front', 'zipper-back'])
  expect(getPouchClosureParts('spout')).toEqual(['spout-neck', 'spout-cap'])
})
```

- [ ] **Step 2: 确认失败并实现附件合同**

Run: `npm run test:run -- src/pouch/pouchGeometry.test.ts`

Expected: FAIL，`getPouchClosureParts` 不存在。

实现：

```ts
export function getPouchClosureParts(closure: PouchClosure) {
  if (closure === 'zipper') return ['zipper-front', 'zipper-back'] as const
  if (closure === 'spout') return ['spout-neck', 'spout-cap'] as const
  return [] as const
}
```

`PrintedPouch` 使用 `useMemo()` 创建并在 cleanup 中释放全部 geometry。正背面复用 `LoadedFaceMaterial` 的纹理加载原则，风琴底固定使用 `#FFFFFF`，圆弧封边使用白色或轻微提亮材质以形成连续高光。拉链用两根横向细圆柱/胶条；吸嘴用居中的短圆柱颈与旋盖，开启吸嘴时顶部封边拆为左右两段。

- [ ] **Step 3: 把场景改为包装类型分派**

将 `BoxScene` 更名为导出兼容的 `PackagingScene`，或保留文件名并新增 props：

```ts
interface BoxSceneProps {
  project: ProjectState
  command: CameraCommandRequest | null
}
```

场景内分派：

```tsx
{project.packagingType === 'box' ? (
  <PrintedBox faces={project.faces} box={project.box} />
) : (
  <PrintedPouch pouch={project.pouch} />
)}
```

保留现有 Canvas、灯光、OrbitControls、相机命令、ContactShadows 和 `exportTransparentPng()`；只根据模型类型调整模型 group 的垂直位置与阴影平面。

- [ ] **Step 4: 运行几何、场景与导出测试**

Run: `npm run test:run -- src/pouch/pouchGeometry.test.ts src/export/transparentPng.test.ts src/scene/PreviewControls.test.tsx`

Expected: PASS。

### Task 7: 接通 App、历史记录和用户流程

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/projectHistory.test.ts`

- [ ] **Step 1: 写完整流程失败测试**

```tsx
it('switches to pouch without changing the four settings areas', async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.click(screen.getByRole('tab', { name: '盒型' }))
  await user.click(screen.getByRole('radio', { name: '自立袋' }))
  await user.click(screen.getByRole('tab', { name: '贴图' }))

  expect(screen.getAllByRole('tab')).toHaveLength(4)
  expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(2)
  expect(screen.getByTestId('packaging-scene')).toHaveAttribute('data-type', 'pouch')
})

it('restores six box uploads after switching back', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('tab', { name: '盒型' }))
  await user.click(screen.getByRole('radio', { name: '自立袋' }))
  await user.click(screen.getByRole('radio', { name: '六面盒型' }))
  await user.click(screen.getByRole('tab', { name: '贴图' }))
  expect(screen.getAllByLabelText(/^上传.+印刷图$/)).toHaveLength(6)
})
```

- [ ] **Step 2: 确认失败**

Run: `npm run test:run -- src/app/App.test.tsx src/app/projectHistory.test.ts`

Expected: FAIL，新流程未接线。

- [ ] **Step 3: 接通上传与面板**

`App.tsx`：

- 将上传错误拆成 `boxFaceErrors` 和 `pouchFaceErrors`。
- 根据 `project.packagingType` 渲染 `FaceGrid` 或 `PouchArtworkGrid`。
- “盒型”标签根据类型渲染 `BoxPanel` 或 `PouchPanel`，类型选择器始终可见。
- 新建项目确认文案改为“会清空当前盒型与自立袋数据”。
- 帮助文案说明两种包装类型。
- 将整个 `project` 传入场景，预览区 aria-label 使用“包装三维预览区”。

每次结构变更都通过 history `commit`。Undo/Redo 必须恢复类型、贴图、袋体厚度和结构设置。

- [ ] **Step 4: 运行 App、history 与 codec 测试**

Run: `npm run test:run -- src/app/App.test.tsx src/app/projectHistory.test.ts src/project/codec.test.ts`

Expected: PASS。

### Task 8: 响应式样式与文档同步

**Files:**
- Modify: `src/styles.css`
- Modify: `PRD.md`
- Modify: `Tech-Spec.md`
- Modify: `acceptance-matrix.md`

- [ ] **Step 1: 增加最小样式**

在现有视觉系统中新增：

```css
.packaging-type-switch,
.closure-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.closure-options {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 720px) {
  .closure-options {
    grid-template-columns: 1fr;
  }
}
```

控件必须复用现有边框、颜色、字体和 focus-visible 规则；390×844 下不能产生横向滚动。

- [ ] **Step 2: 同步中文产品文档**

更新三份文档，明确：两种包装类型、两面上传、固定白色风琴底、可调袋体厚度、圆弧截面三边封、四角圆角、三种互斥封口、version 1 迁移和浏览器验收。删除 PRD 中“贴图面板始终提供六个入口”的绝对表述，改成按包装类型定义，仍保留六面盒型必须为六个入口。

- [ ] **Step 3: 运行静态与全量验证**

Run: `npm run typecheck && npm run lint && npm run test:run && npm run build && npm run test:sites`

Expected: 全部退出码为 0；构建产出 `dist/client/index.html`、`dist/server/index.js`、`dist/.openai/hosting.json`。

### Task 9: 真实浏览器验收与修复循环

**Files:**
- Modify only files implicated by observed defects.

- [ ] **Step 1: 启动本地应用**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite 返回可访问的本地 URL。若出现 `listen EPERM`，使用受控授权重新启动，不修改产品代码规避权限问题。

- [ ] **Step 2: 桌面流程验收**

使用 Browser 插件复用一个专用本地测试标签页，验证：

1. 默认六面盒型与六个上传入口。
2. 切换自立袋后出现两面上传和袋体模型。
3. 上传代表性正面、背面图片后贴图方向正确。
4. 调整袋体厚度后，正背片距离和三边封圆弧厚度同步变化，边缘没有双纸片拼接感。
5. 底部风琴始终为白色，四角圆角开关产生明显轮廓变化。
6. 无封口、拉链、顶部居中吸嘴严格互斥且结构可见。
7. 切回六面盒型后六面状态未丢失，再切回袋型后两面状态未丢失。
8. 相机拖拽、缩放、固定视角和自动旋转正常。
9. 导出 PNG 实际下载，使用 `file`/图像检查确认 2000×2000 且含 alpha。
10. Console 无相关 error 或未解释 warning。

- [ ] **Step 3: 390×844 移动端验收**

在 390×844 视口重复类型切换、两面上传、袋体厚度、圆角与三种封口操作，检查文字、按钮、缩略图和 Canvas 无遮挡、溢出或不可点击状态。

- [ ] **Step 4: 视觉结构对照与修复**

逐项对照用户视频和图片：正背片薄膜弧度、无独立侧面、左/右/顶部圆弧厚封边、无双纸片拼接感、白色底部撑开、顶部压封、拉链凸条、居中吸嘴、四角圆角。记录每项的参考证据、渲染证据与修复；发现问题后做最小修改并重复 Steps 2-3。

- [ ] **Step 5: 最终回归**

Run: `npm run typecheck && npm run lint && npm run test:run && npm run build && npm run test:sites`

Expected: 全部通过，且浏览器最终截图与交互证据来自最后一次构建状态。
