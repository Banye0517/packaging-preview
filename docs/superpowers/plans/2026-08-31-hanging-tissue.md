# Hanging Tissue Packaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增“悬挂抽纸”独立盒型：四面原生 UV 贴图、可选抽纸节点、内包装式尺寸和高级微调，并保持现有盒型不变。

**Architecture:** 将 `悬挂纸巾.gltf` 放进本地静态模型目录，只渲染 `悬挂抽纸开` 层级，使用节点 `纸.1` 的可见性实现抽纸开关。新纹理模块从包装主体网格的法线、索引和原生 UV 提取正/背/左/右四个区域，在一个画布中按各区域裁切并绘制四张图片；状态、序列化和 UI 都使用新增的独立 `hangingTissue` 分支。

**Tech Stack:** React 18、TypeScript、React Three Fiber、Three.js、@react-three/drei、Vitest、Vite。

---

## 文件结构

- `public/models/hanging-tissue.gltf`：用户提供模型的运行时静态资源。
- `src/hangingTissue/hangingTissueTexture.ts`：四个可打印面的 UV 区域提取与 Canvas atlas 绘制。
- `src/hangingTissue/PrintedHangingTissue.tsx`：加载模型、保留唯一“开”层级、给可打印主体挂贴图、切换 `纸.1`。
- `src/hangingTissue/HangingTissueArtworkUploader.tsx`：正、背、左、右上传和默认收起的高级微调。
- `src/hangingTissue/HangingTissuePanel.tsx`：宽高、模型方向和“显示抽纸”开关。
- `src/app/types.ts`、`src/app/projectReducer.ts`、`src/project/codec.ts`：新增状态、动作、默认值、版本迁移和输入校验。
- `src/app/App.tsx`、`src/scene/BoxScene.tsx`：将新盒型接入上传、盒型、工艺不可用提示、帮助、3D 与 PNG 导出入口。
- 对应 `*.test.ts(x)`：测试模型资产、UV、状态、迁移、UI 和场景分支。
- `AGENTS.md`、`PRD.md`、`Tech-Spec.md`：记录这项持久产品约束。

### Task 1: 锁定模型资产与原生 UV 可用性

**Files:**
- Create: `public/models/hanging-tissue.gltf`
- Create: `src/hangingTissue/hangingTissueModelAsset.test.ts`

- [ ] **Step 1: 写失败的模型结构测试**

```ts
import modelSource from '../../public/models/hanging-tissue.gltf?raw'

it('contains an open hierarchy, printable body UVs, and a pulled-sheet node', () => {
  const model = JSON.parse(modelSource)
  expect(model.nodes.some((node: { name?: string }) => node.name === '悬挂抽纸开')).toBe(true)
  expect(model.nodes.some((node: { name?: string }) => node.name === '纸.1')).toBe(true)
  const body = model.meshes.find((mesh: { name?: string }) => mesh.name === '悬挂抽纸155-材质.2')
  expect(body?.primitives[0].attributes).toMatchObject({
    POSITION: expect.any(Number), NORMAL: expect.any(Number), TEXCOORD_0: expect.any(Number),
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- src/hangingTissue/hangingTissueModelAsset.test.ts`

Expected: FAIL，模型文件尚未存在。

- [ ] **Step 3: 复制用户提供的单一 glTF，不修改其内部 UV**

```bash
cp /Users/banye/Downloads/悬挂纸巾/悬挂纸巾.gltf public/models/hanging-tissue.gltf
```

- [ ] **Step 4: 运行模型测试确认通过**

Run: `npm test -- src/hangingTissue/hangingTissueModelAsset.test.ts`

Expected: PASS，测试同时证明模型包含开状态根节点、`纸.1` 与可打印主体属性。

- [ ] **Step 5: 提交资产与测试**

```bash
git add public/models/hanging-tissue.gltf src/hangingTissue/hangingTissueModelAsset.test.ts
git commit -m "feat: add hanging tissue model asset"
```

### Task 2: 添加独立项目状态与向后兼容迁移

**Files:**
- Modify: `src/app/types.ts`
- Modify: `src/app/projectReducer.ts`
- Modify: `src/app/projectReducer.test.ts`
- Modify: `src/project/codec.ts`
- Modify: `src/project/codec.test.ts`

- [ ] **Step 1: 写失败的 reducer 与 codec 测试**

```ts
expect(createInitialProject().version).toBe(12)
expect(createInitialProject().hangingTissue).toEqual({
  faces: { front: null, back: null, left: null, right: null },
  transforms: expect.any(Object), selectedFace: 'front', width: 160, height: 205,
  modelRotation: 0, showPulledSheet: true,
})

expect(projectReducer(initial, {
  type: 'hanging-tissue/set-pulled-sheet', value: false,
}).hangingTissue.showPulledSheet).toBe(false)

const v11 = { ...createInitialProject(), version: 11 }
delete (v11 as Partial<typeof v11>).hangingTissue
expect(decodeProject(JSON.stringify(v11)).hangingTissue.showPulledSheet).toBe(true)
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- src/app/projectReducer.test.ts src/project/codec.test.ts`

Expected: FAIL，`hangingTissue`、版本 12 和动作尚不存在。

- [ ] **Step 3: 实现最小状态、动作与迁移**

```ts
export const HANGING_TISSUE_FACES = ['front', 'back', 'left', 'right'] as const
export type HangingTissueFace = (typeof HANGING_TISSUE_FACES)[number]
export type PackagingType = /* existing */ | 'hanging-tissue'

export interface HangingTissueState {
  faces: Record<HangingTissueFace, ArtworkAsset | null>
  transforms: Record<HangingTissueFace, ArtworkTransform>
  selectedFace: HangingTissueFace
  width: number
  height: number
  modelRotation: InnerPackagingModelRotation
  showPulledSheet: boolean
}
```

将 `ProjectState.version` 变为 `12`；新增 `createDefaultHangingTissue()`；新增面上传/移除/选择、变换/重置、宽高/方向与纸张开关 reducer 动作。Codec 先验证完整 v12，再把有效 v11 和更早版本升级到 v12，并创建默认悬挂抽纸状态；校验四个唯一面键、六项变换、正数宽高、合法方向与布尔开关。

- [ ] **Step 4: 运行状态与迁移测试确认通过**

Run: `npm test -- src/app/projectReducer.test.ts src/project/codec.test.ts`

Expected: PASS，且现有 v1–v11 迁移测试仍通过。

- [ ] **Step 5: 提交状态与迁移**

```bash
git add src/app/types.ts src/app/projectReducer.ts src/app/projectReducer.test.ts src/project/codec.ts src/project/codec.test.ts
git commit -m "feat: add hanging tissue project state"
```

### Task 3: 以四面真实 UV 绘制受裁切的贴图 atlas

**Files:**
- Create: `src/hangingTissue/hangingTissueTexture.ts`
- Create: `src/hangingTissue/hangingTissueTexture.test.ts`

- [ ] **Step 1: 写失败的 UV 提取与绘制测试**

```ts
const regions = extractHangingTissueUvRegions(geometry)
expect(regions).toEqual({
  front: expect.objectContaining({ minU: expect.any(Number) }),
  back: expect.objectContaining({ minU: expect.any(Number) }),
  left: expect.objectContaining({ minU: expect.any(Number) }),
  right: expect.objectContaining({ minU: expect.any(Number) }),
})
expect(() => extractHangingTissueUvRegions(noIndexGeometry)).toThrow(
  'Hanging tissue model contains no index',
)

drawHangingTissueAtlas(context, 1024, { front: { image, transform } }, regions)
expect(context.clip).toHaveBeenCalledTimes(1)
expect(context.drawImage).toHaveBeenCalledTimes(1)
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- src/hangingTissue/hangingTissueTexture.test.ts`

Expected: FAIL，纹理模块尚不存在。

- [ ] **Step 3: 实现按法线与原生 UV 分组的 atlas**

```ts
export function extractHangingTissueUvRegions(geometry: BufferGeometry) {
  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  const uv = geometry.getAttribute('uv')
  const index = geometry.getIndex()
  if (!position) throw new Error('Hanging tissue model contains no positions')
  if (!normal || !uv) throw new Error('Hanging tissue model contains no normals or UVs')
  if (!index) throw new Error('Hanging tissue model contains no index')
  // 仅归类 |normal.z| 或 |normal.x| 最大的三角形；y 向顶部、底部不进入四面。
}
```

对每个三角形选择绝对值最大的 x/z 法线方向，分别累积 `front`、`back`、`left`、`right` 的 UV 边界；若任一边界无效即抛出明确错误。绘制时先白底，针对每面建立该 UV 区域矩形裁切，先固定模型方向校准、再叠加该面的六项用户变换，使用 `aspect-fill` 填充且不平铺、不补边。固定方向常量与用户 `rotation` 分开，确保重置为用户零值仍正确。

- [ ] **Step 4: 运行纹理测试确认通过**

Run: `npm test -- src/hangingTissue/hangingTissueTexture.test.ts`

Expected: PASS，测试证明四面不会共享裁切区域、仅当前面的变换影响当前绘制、缺失属性明确失败。

- [ ] **Step 5: 提交纹理模块**

```bash
git add src/hangingTissue/hangingTissueTexture.ts src/hangingTissue/hangingTissueTexture.test.ts
git commit -m "feat: map hanging tissue artwork by UV"
```

### Task 4: 渲染唯一开状态模型与抽纸节点开关

**Files:**
- Create: `src/hangingTissue/PrintedHangingTissue.tsx`
- Create: `src/hangingTissue/PrintedHangingTissue.test.ts`
- Modify: `src/scene/BoxScene.tsx`
- Modify: `src/scene/BoxScene.test.tsx`

- [ ] **Step 1: 写失败的模型渲染与场景分支测试**

```tsx
render(<PrintedHangingTissue value={createInitialProject().hangingTissue} />)
expect(useGLTF).toHaveBeenCalledWith('/models/hanging-tissue.gltf')

render(<BoxScene project={{ ...project, packagingType: 'hanging-tissue' }} command={null} />)
expect(screen.getByTestId('printed-hanging-tissue')).toBeInTheDocument()
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- src/hangingTissue/PrintedHangingTissue.test.ts src/scene/BoxScene.test.tsx`

Expected: FAIL，渲染组件和 `hanging-tissue` 分支尚不存在。

- [ ] **Step 3: 实现单层级模型渲染**

```tsx
export const HANGING_TISSUE_MODEL_URL = '/models/hanging-tissue.gltf'

function setPulledSheetVisibility(root: Object3D, visible: boolean) {
  const pulledSheet = root.getObjectByName('纸.1')
  if (!pulledSheet) throw new Error('Hanging tissue model contains no pulled-sheet node')
  pulledSheet.visible = visible
}
```

加载后克隆并只保留 `悬挂抽纸开` 根节点；不要将整个 source `scene` 直接渲染，也不要渲染重复的 `悬挂抽纸` 根节点。只对名为 `悬挂抽纸155-材质.2` 的可打印主体克隆材质并接入 atlas，其余悬挂结构与内纸保留原材质。按照内包装缩放逻辑应用宽高与 `modelRotation`；在 `BoxScene` 增加显式 `hanging-tissue` 分支，以便透明 PNG 使用同一 3D 场景。

- [ ] **Step 4: 运行渲染测试确认通过**

Run: `npm test -- src/hangingTissue/PrintedHangingTissue.test.ts src/scene/BoxScene.test.tsx`

Expected: PASS，开关只改变 `纸.1`，不会渲染无纸重复层级。

- [ ] **Step 5: 提交 3D 渲染**

```bash
git add src/hangingTissue/PrintedHangingTissue.tsx src/hangingTissue/PrintedHangingTissue.test.ts src/scene/BoxScene.tsx src/scene/BoxScene.test.tsx
git commit -m "feat: render hanging tissue packaging"
```

### Task 5: 接入四面上传、默认收起微调与盒型设置

**Files:**
- Create: `src/hangingTissue/HangingTissueArtworkUploader.tsx`
- Create: `src/hangingTissue/HangingTissueArtworkUploader.test.tsx`
- Create: `src/hangingTissue/HangingTissuePanel.tsx`
- Create: `src/hangingTissue/HangingTissuePanel.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`

- [ ] **Step 1: 写失败的交互测试**

```tsx
render(<HangingTissueArtworkUploader {...props} />)
expect(screen.getByRole('button', { name: '上传正面图片' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: '上传背面图片' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: '上传左侧图片' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: '上传右侧图片' })).toBeInTheDocument()
expect(screen.queryByLabelText('贴图缩放')).not.toBeInTheDocument()

render(<HangingTissuePanel value={value} onChange={onChange} />)
await user.click(screen.getByRole('checkbox', { name: '显示抽纸' }))
expect(onChange).toHaveBeenCalledWith('showPulledSheet', false)
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- src/hangingTissue/HangingTissueArtworkUploader.test.tsx src/hangingTissue/HangingTissuePanel.test.tsx src/app/App.test.tsx`

Expected: FAIL，新 UI 和应用路由尚不存在。

- [ ] **Step 3: 实现最小 UI 与 App 路由**

```tsx
const FACES = [
  { face: 'front', label: '正面' }, { face: 'back', label: '背面' },
  { face: 'left', label: '左侧' }, { face: 'right', label: '右侧' },
] as const

<details className="texture-transform-disclosure">
  <summary>高级调整</summary>
  {/* scale, offsetX, offsetY, rotation, stretchX, stretchY, reset */}
</details>
```

复制内包装2已验证的上传、校验、图片读取和六项调整交互，但只接受 `HangingTissueFace`，并显示四个面。新增类型单选项“悬挂抽纸”；贴图标题与说明明确“正、背、左、右”及“按模型原生 UV 映射”；设置页提供宽高、方向和“显示抽纸”开关；工艺 tab 显示“悬挂抽纸暂不支持表面工艺”。更新打开/新建时的错误清理与帮助文案，避免仍宣称只有四种包装状态。

- [ ] **Step 4: 运行 UI 与应用测试确认通过**

Run: `npm test -- src/hangingTissue/HangingTissueArtworkUploader.test.tsx src/hangingTissue/HangingTissuePanel.test.tsx src/app/App.test.tsx`

Expected: PASS，四面齐全、没有上/下、微调初始隐藏、切换/上传/移除动作正确。

- [ ] **Step 5: 提交 UI 接入**

```bash
git add src/hangingTissue/HangingTissueArtworkUploader.tsx src/hangingTissue/HangingTissueArtworkUploader.test.tsx src/hangingTissue/HangingTissuePanel.tsx src/hangingTissue/HangingTissuePanel.test.tsx src/app/App.tsx src/app/App.test.tsx
git commit -m "feat: add hanging tissue controls"
```

### Task 6: 更新产品文档并进行全量回归和真实浏览器验收

**Files:**
- Modify: `AGENTS.md`
- Modify: `PRD.md`
- Modify: `Tech-Spec.md`

- [ ] **Step 1: 更新持久产品规则**

在 `AGENTS.md` 的 Durable Packaging Decisions 增加“悬挂抽纸”规则：单一模型、四面上传、无顶底、`纸.1` 开关、原生 UV 自动映射、六项默认收起微调、无表面工艺。同步 `PRD.md` 与 `Tech-Spec.md` 的包装类型数量、状态结构、行为与验收清单。

- [ ] **Step 2: 运行完整自动验证**

Run: `npm test && npm run typecheck && npm run lint && npm run build && npm run test:sites`

Expected: 全部 PASS；若 Vite 只报告已知包体积 warning，记录为 warning 而不是失败。

- [ ] **Step 3: 独立浏览器真实验收**

用独立本地测试标签页（不刷新或占用用户当前页面）打开预览：

1. 选择“悬挂抽纸”，确认只出现正、背、左、右四张上传卡。
2. 上传四张颜色和方向文字不同的 PNG，逐面旋转模型确认默认贴图不串面。
3. 展开“高级调整”，改变左侧旋转和右侧水平拉伸，确认仅所选面变化；点击重置确认回到自动贴合。
4. 切换“显示抽纸”两次，确认仅下方抽出的纸显隐，包装主体保持原位。
5. 修改尺寸/方向，保存并重新打开项目，确认四图、变换、开关和尺寸保留；导出透明 PNG，确认当前模型状态被导出。

- [ ] **Step 4: 提交文档与最终验证结果**

```bash
git add AGENTS.md PRD.md Tech-Spec.md
git commit -m "docs: document hanging tissue packaging"
git status --short
```

Expected: 工作树干净；最终汇报四面自动 UV、抽纸开关、实际浏览器检查结果以及模型 UV 的任何已验证限制。
