# 面纸盒型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有包装预览中新增一个使用 GLTF 原生 UV、单张完整图稿上传、可调尺寸和顶部抽纸显隐的“面纸”盒型。

**Architecture:** 新增 `src/faceTissue/` 模块，独立负责面纸模型节点提取、主体尺寸变形、单图稿 canvas 变换和设置 UI。全局状态只新增 `faceTissue` 分支；`App`、`BoxScene` 和 `codec` 通过窄接口接入，既有五种包装类型和悬挂抽纸实现保持不变。

**Tech Stack:** React 18, TypeScript, Three.js, React Three Fiber, drei `useGLTF`, Vitest, Testing Library, Vite。

---

## 文件地图

### 新建

- `public/models/face-tissue.gltf`：用户提供的面纸 GLTF 资产。
- `src/faceTissue/faceTissueModel.ts`：模型 URL、节点名、材质职责和节点查找/资产校验。
- `src/faceTissue/faceTissueDeformation.ts`：主体网格的宽高厚度变形和顶部抽纸锚点计算。
- `src/faceTissue/FaceTissueArtworkUploader.tsx`：单图稿上传、删除和默认收起的高级变换控件。
- `src/faceTissue/FaceTissuePanel.tsx`：面纸宽高厚度、模型方向和抽纸显隐控制。
- `src/faceTissue/PrintedFaceTissue.tsx`：GLTF 克隆、主体/侧面/抽纸材质分离和渲染。
- `src/faceTissue/faceTissueModel.test.ts`、`faceTissueDeformation.test.ts`、`FaceTissueArtworkUploader.test.tsx`、`FaceTissuePanel.test.tsx`、`PrintedFaceTissue.test.ts`：新模块的单元和组件测试。

### 修改

- `src/app/types.ts`：增加 `face-tissue` 类型和 `FaceTissueState`。
- `src/app/projectReducer.ts`、`src/app/projectReducer.test.ts`：默认状态和 reducer action。
- `src/project/codec.ts`、`src/project/codec.test.ts`：version 16 迁移和校验。
- `src/app/App.tsx`、`src/app/App.test.tsx`：上传处理、变换/尺寸/开关 action 分发、贴图和盒型面板分发。
- `src/scene/BoxScene.tsx`、`src/scene/BoxScene.test.tsx`：场景分发。
- `src/scene/artworkRendererPolicy.test.ts`：确认面纸使用 direct-color artwork。

不修改 `.openai/hosting.json`、`worker/index.js`、`scripts/prepare-sites-build.mjs`、`tests/sites-worker.test.mjs`。

## 实施约束

- 所有新增程序设计说明和注释使用中文；代码符号、文件名和 commit message 使用英文。
- 只把 `Default` 网格作为印刷主体；`Default-材质.2` 保持白色受光侧面；`纸` 节点独立显隐。
- 直接使用 GLTF 原生 UV，不重建平面 UV，不把图稿贴到左右侧面。
- 有图稿时使用 `createArtworkMaterial(texture)`；无图稿时使用 `MeshStandardMaterial`。
- artwork canvas 的默认绘制矩阵为 scale 100、offset 0/0、rotation 0、stretch 100/100；用户上传不会偷偷改变这些值。

## Task 1: 建立模型资产边界和失败测试

**Files:**
- Create: `public/models/face-tissue.gltf`
- Create: `src/faceTissue/faceTissueModel.ts`
- Create: `src/faceTissue/faceTissueModel.test.ts`

- [ ] **Step 1: 复制用户提供的二进制/文本 GLTF 到 public。**

Run:

```bash
cp '/Users/banye/Downloads/面纸/面纸.gltf' public/models/face-tissue.gltf
```

Expected: `public/models/face-tissue.gltf` 存在，内容仍为用户提供的嵌入式 GLTF，不修改 PSD 或源文件。

- [ ] **Step 2: 写资产契约测试。**

```ts
import { describe, expect, it } from 'vitest'
import modelSource from '../../public/models/face-tissue.gltf?raw'
import {
  FACE_TISSUE_MODEL_URL,
  FACE_TISSUE_PRINTABLE_MESH_NAME,
  FACE_TISSUE_SIDE_MESH_NAME,
  FACE_TISSUE_TOP_SHEET_NAME,
} from './faceTissueModel'

describe('face tissue model asset', () => {
  it('uses the supplied model and required node responsibilities', () => {
    expect(FACE_TISSUE_MODEL_URL).toBe('/models/face-tissue.gltf')
    expect(FACE_TISSUE_PRINTABLE_MESH_NAME).toBe('Default')
    expect(FACE_TISSUE_SIDE_MESH_NAME).toBe('Default-材质.2')
    expect(FACE_TISSUE_TOP_SHEET_NAME).toBe('纸')
    expect(modelSource).toContain('TEXCOORD_0')
    expect(modelSource).toContain('面纸打开')
  })
})
```

- [ ] **Step 3: 运行失败测试。**

Run: `npm test -- --run src/faceTissue/faceTissueModel.test.ts`

Expected: FAIL because `faceTissueModel.ts` does not exist yet.

- [ ] **Step 4: 实现模型常量和安全查找。**

实现 `FACE_TISSUE_MODEL_URL`、三个节点常量，并提供与悬挂抽纸一致的 `findFaceTissueNode(root, name)`：只接受 `Object3D` 根节点，找不到节点时由渲染层抛出包含节点名的错误；`isFaceTissueMesh` 必须检查 `isMesh === true`、`geometry` 存在且包含 `position` 和 `uv`。

- [ ] **Step 5: 运行资产测试并提交。**

Run: `npm test -- --run src/faceTissue/faceTissueModel.test.ts`

Expected: PASS。

Commit: `git add public/models/face-tissue.gltf src/faceTissue/faceTissueModel.ts src/faceTissue/faceTissueModel.test.ts && git commit -m "feat: add face tissue model asset contract"`

## Task 2: 增加状态、reducer 和旧项目迁移

**Files:**
- Modify: `src/app/types.ts`
- Modify: `src/app/projectReducer.ts`
- Modify: `src/app/projectReducer.test.ts`
- Modify: `src/project/codec.ts`
- Modify: `src/project/codec.test.ts`

- [ ] **Step 1: 写状态和迁移失败测试。**

在 `projectReducer.test.ts` 增加以下断言：初始 `faceTissue.artwork === null`、`showTopSheet === true`、变换等于 `{ scale: 100, offsetX: 0, offsetY: 0, rotation: 0, stretchX: 100, stretchY: 100 }`；`face-tissue/set` 能更新 `width/height/thickness`；`face-tissue/set-top-sheet` 只更新开关；超出变换范围和非正尺寸保持旧状态。在 `codec.test.ts` 从当前项目构造 version 15 文档，解码后得到 version 16 且保留默认面纸状态。

```ts
expect(initial.faceTissue.showTopSheet).toBe(true)
expect(initial.faceTissue.artworkTransform).toEqual({
  scale: 100, offsetX: 0, offsetY: 0, rotation: 0, stretchX: 100, stretchY: 100,
})
expect(projectReducer(initial, {
  type: 'face-tissue/set-top-sheet', value: false,
}).faceTissue.showTopSheet).toBe(false)
```

- [ ] **Step 2: 运行失败测试。**

Run: `npm test -- --run src/app/projectReducer.test.ts src/project/codec.test.ts`

Expected: FAIL because `faceTissue`, new actions and version 16 validation are missing.

- [ ] **Step 3: 定义 `FaceTissueState` 和默认值。**

在 `src/app/types.ts` 增加：

```ts
export type PackagingType = 'box' | 'pouch' | 'inner-packaging-1' | 'inner-packaging-2' | 'hanging-tissue' | 'face-tissue'

export interface FaceTissueState {
  artwork: ArtworkAsset | null
  width: number
  height: number
  thickness: number
  artworkTransform: ArtworkTransform
  modelRotation: InnerPackagingModelRotation
  showTopSheet: boolean
}
```

并在 `ProjectState` 增加 `faceTissue: FaceTissueState`。默认尺寸使用当前面纸模型实测包围盒映射到与既有模型相同的预览高度，初始 `width: 160`、`height: 205`、`thickness: 80`；若实测后基准不同，只调整默认数值和对应测试，不改变接口。

- [ ] **Step 4: 实现 reducer action 和边界。**

增加 `face-tissue/artwork-set/remove`、`transform-set/reset`、`rotation-set`、`set`、`set-top-sheet`。变换边界使用 `ArtworkTransform` 的统一范围：scale/stretch 50–300、offset -100–100、rotation -180–180；尺寸必须为有限正数；rotation 只接受 0/90/180。所有 action 返回新对象且不修改其他包装类型。

- [ ] **Step 5: 增加 codec version 16。**

将 `ProjectState.version` 和初始项目提升到 16；新增 `Version15ProjectState` 兼容类型，校验 version 15 的完整既有字段，再通过 `createDefaultFaceTissue()` 添加面纸状态；version 16 校验 `faceTissue` 的 asset、尺寸、变换、rotation 和 boolean。旧项目原有 `packagingType` 不改，新增类型只有用户主动选择时才生效。

- [ ] **Step 6: 运行状态和迁移测试并提交。**

Run: `npm test -- --run src/app/projectReducer.test.ts src/project/codec.test.ts`

Expected: PASS。

Commit: `git add src/app/types.ts src/app/projectReducer.ts src/app/projectReducer.test.ts src/project/codec.ts src/project/codec.test.ts && git commit -m "feat: add face tissue project state"`

## Task 3: 实现主体尺寸变形和 UV 保留

**Files:**
- Create: `src/faceTissue/faceTissueDeformation.ts`
- Create: `src/faceTissue/faceTissueDeformation.test.ts`

- [ ] **Step 1: 写变形失败测试。**

用带有 `position` 和 `uv` 的最小 `BufferGeometry` fixture 验证：宽、高、厚度分别改变位置轴；底部最小高度保持不变；原始 UV 数组逐项不变；源 geometry 不被修改；顶部抽纸锚点根据主体高度移动但其原始尺寸不变。

```ts
const result = deformFaceTissueGeometry(source, {
  sourceBounds: { minX: -2, maxX: 2, minY: 0, maxY: 4, minZ: -1, maxZ: 1 },
  width: 8, height: 6, thickness: 4,
})
expect(result.getAttribute('uv').array).toEqual(source.getAttribute('uv').array)
expect(result.boundingBox?.min.y).toBeCloseTo(0)
expect(source.getAttribute('position').getX(0)).toBe(-2)
```

- [ ] **Step 2: 运行失败测试。**

Run: `npm test -- --run src/faceTissue/faceTissueDeformation.test.ts`

Expected: FAIL because the deformation module does not exist.

- [ ] **Step 3: 实现变形函数。**

复制 `BufferGeometry`，按 source bounds 将主体坐标分别映射到目标 width/height/thickness；Y 轴以 source `min.y` 为底部锚点，完成后调用 `computeVertexNormals()`、`computeBoundingBox()`、`computeBoundingSphere()`。导出 `calculateTopSheetAnchor(sourceBody, targetBody)`，只返回顶部抽纸的平移值，不缩放抽纸节点。

- [ ] **Step 4: 运行变形测试并提交。**

Run: `npm test -- --run src/faceTissue/faceTissueDeformation.test.ts`

Expected: PASS。

Commit: `git add src/faceTissue/faceTissueDeformation.ts src/faceTissue/faceTissueDeformation.test.ts && git commit -m "feat: deform face tissue body dimensions"`

## Task 4: 实现面纸渲染器

**Files:**
- Create: `src/faceTissue/PrintedFaceTissue.tsx`
- Create: `src/faceTissue/PrintedFaceTissue.test.ts`
- Modify: `src/scene/BoxScene.tsx`
- Modify: `src/scene/BoxScene.test.tsx`
- Modify: `src/scene/artworkRendererPolicy.test.ts`

- [ ] **Step 1: 写渲染边界失败测试。**

用 source-text/静态契约测试先固定关键边界：渲染器加载 `/models/face-tissue.gltf`；查找 `Default`、`Default-材质.2`、`纸`；无图稿时创建 `MeshStandardMaterial`；有图稿时 `Default` 使用 `createArtworkMaterial`；左右侧面不使用 artwork；抽纸 visible 绑定 `showTopSheet`；外层 group 绑定 0/90/180 rotation。

```ts
expect(source).toContain("useGLTF('/models/face-tissue.gltf')")
expect(source).toContain('FACE_TISSUE_PRINTABLE_MESH_NAME')
expect(source).toContain('createArtworkMaterial')
expect(source).toContain('value.showTopSheet')
```

- [ ] **Step 2: 实现模型克隆和材质分层。**

在 `useMemo` 中 clone 根节点，提取三个职责节点；`Default` 使用变形后的 geometry，`Default-材质.2` 使用原始 geometry，`纸` 保持独立 clone。主体有 artwork 时在 canvas 上将整张 image 绘制为 UV 对齐图层并生成 `CanvasTexture`，设置 `SRGBColorSpace`、`flipY = false`；未上传时返回受光白材质。所有创建的 geometry、texture、material 在 effect cleanup 中 dispose。

- [ ] **Step 3: 接入尺寸、抽纸开关和模型方向。**

主体 geometry 的尺寸依赖 `width/height/thickness`；抽纸节点只根据 `showTopSheet` 设置 visible，并按 `calculateTopSheetAnchor` 更新位置；根 group 使用 `rotation={[0, 0, modelRotation * Math.PI / 180]}`。底部使用面纸模型的本地 ground offset 对齐现有场景。

- [ ] **Step 4: 接入 BoxScene 分发。**

在 `BoxScene.tsx` 引入 `PrintedFaceTissue`，将最后的 hanging tissue 分支改为显式 `packagingType === 'hanging-tissue'`，新增 `face-tissue` 分支，避免新盒型误落到悬挂抽纸。

- [ ] **Step 5: 运行渲染契约测试并提交。**

Run: `npm test -- --run src/faceTissue/PrintedFaceTissue.test.ts src/scene/BoxScene.test.tsx src/scene/artworkRendererPolicy.test.ts`

Expected: PASS。

Commit: `git add src/faceTissue/PrintedFaceTissue.tsx src/faceTissue/PrintedFaceTissue.test.ts src/scene/BoxScene.tsx src/scene/BoxScene.test.tsx src/scene/artworkRendererPolicy.test.ts && git commit -m "feat: render face tissue packaging"`

## Task 5: 实现上传和设置面板

**Files:**
- Create: `src/faceTissue/FaceTissueArtworkUploader.tsx`
- Create: `src/faceTissue/FaceTissuePanel.tsx`
- Create: `src/faceTissue/FaceTissueArtworkUploader.test.tsx`
- Create: `src/faceTissue/FaceTissuePanel.test.tsx`

- [ ] **Step 1: 写 UI 失败测试。**

验证上传区只有一个上传入口、显示“面纸图稿（完整 UV）”、高级调整的 `<details>` 默认没有 `open`、删除和重置回调可触发；面板显示宽/高/厚度、0/90/180 方向和“顶部抽纸”开关。

```tsx
expect(screen.getAllByRole('button', { name: /上传/ })).toHaveLength(1)
expect(screen.getByText('高级调整').closest('details')).not.toHaveAttribute('open')
expect(screen.getByRole('checkbox', { name: '顶部抽纸' })).toBeChecked()
```

- [ ] **Step 2: 运行失败测试。**

Run: `npm test -- --run src/faceTissue/FaceTissueArtworkUploader.test.tsx src/faceTissue/FaceTissuePanel.test.tsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: 实现单图上传器。**

复用 `FaceUploader`、`ArtworkAsset` 和 `ArtworkTransform`；上传卡片只接受一个 artwork，上传成功调用 `onUpload(file)`，删除调用 `onRemove()`。高级区显示 `scale`、`offsetX`、`offsetY`、`rotation`、`stretchX`、`stretchY` 六项，范围分别为 50–300、-100–100、-100–100、-180–180、50–300、50–300；初始不展开。

- [ ] **Step 4: 实现面板。**

参照 `HangingTissuePanel` 的 radio 方向控件和 dimension field，使用 `width/height/thickness` 三个输入；开关受控于 `showTopSheet`。不加入圆角、侧面上传、工艺或其他设置。

- [ ] **Step 5: 运行 UI 测试并提交。**

Run: `npm test -- --run src/faceTissue/FaceTissueArtworkUploader.test.tsx src/faceTissue/FaceTissuePanel.test.tsx`

Expected: PASS。

Commit: `git add src/faceTissue/FaceTissueArtworkUploader.tsx src/faceTissue/FaceTissuePanel.tsx src/faceTissue/FaceTissueArtworkUploader.test.tsx src/faceTissue/FaceTissuePanel.test.tsx && git commit -m "feat: add face tissue controls"`

## Task 6: 接入 App、codec UI 回归和完整自动化测试

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/projectReducer.test.ts`
- Modify: `src/project/codec.test.ts`

- [ ] **Step 1: 写 App 集成失败测试。**

增加用例：选择“面纸”后场景 `data-type` 为 `face-tissue`；贴图区只出现一个面纸上传入口和高级调整；盒型区出现厚度与抽纸开关；上传代表性 PNG 后 artwork 进入 `project.faceTissue`；切换抽纸后仅 `showTopSheet` 改变。

- [ ] **Step 2: 运行失败测试。**

Run: `npm test -- --run src/app/App.test.tsx`

Expected: FAIL because `PackagingType`、App handlers and panel branches do not include `face-tissue`.

- [ ] **Step 3: 接入 App handler。**

新增 `handleFaceTissueArtworkUpload(file)`，复用现有 `validateImage(file)` 和 `readImageDataUrl(file)`，提交 `face-tissue/artwork-set`；新增 remove、transform、reset、dimension、rotation、top-sheet callbacks，全部通过现有 `commit({ type: 'commit', action })` 进入历史记录。

- [ ] **Step 4: 接入盒型选择、贴图区和盒型区。**

包装选择器增加“面纸”；artwork tab 按 `project.packagingType === 'face-tissue'` 渲染 `FaceTissueArtworkUploader`；box tab 渲染 `FaceTissuePanel`；finish tab 对面纸显示现有不支持提示或空状态，不新增工艺控件。确认四个设置区域仍保持不变。

- [ ] **Step 5: 运行 App 和所有自动化测试。**

Run: `npm test -- --run`

Expected: PASS，且既有 box、pouch、inner packaging、hanging tissue 用例不减少。

- [ ] **Step 6: 运行类型、lint、构建和 Sites 测试。**

Run:

```bash
npm run typecheck
npm run lint
npm run build
npm run test:sites
git diff --check
```

Expected: 全部 PASS；build 产物包含 `dist/client/index.html`、`dist/server/index.js`、`dist/.openai/hosting.json`。

- [ ] **Step 7: 提交集成结果。**

Commit: `git add src/app/App.tsx src/app/App.test.tsx src/app/projectReducer.test.ts src/project/codec.test.ts && git commit -m "feat: integrate face tissue packaging"`

## Task 7: ego 浏览器真实验收

**Files:**
- No source changes unless a concrete browser regression is found; fix the smallest relevant file and rerun the affected test.

- [ ] **Step 1: 启动本地服务器。**

先执行 `lsof -nP -iTCP -sTCP:LISTEN` 确认端口；按项目现有启动脚本启动 Vite，记录真实输出 URL，不假设旧端口仍在运行。

- [ ] **Step 2: 使用 ego 新建独立任务空间和标签页。**

执行 `ego-browser nodejs`，调用 `useOrCreateTaskSpace('face tissue packaging QA')`；使用新标签页打开本地 URL，不复用用户可能存在的未保存页面。

- [ ] **Step 3: 验证核心流程。**

在 ego 中检查：选择“面纸”后出现单上传入口；上传一张代表性 PNG；确认首次显示时前/后/上/下图稿与 UV 参考关系一致，左右侧面仍为白色受光结构；确认抽纸默认显示，关闭后 `纸` 节点消失，再打开恢复。

- [ ] **Step 4: 验证高级变换和尺寸。**

展开“高级调整”，逐项改动旋转、缩放、水平/垂直位置和拉伸，确认 3D 预览变化；修改宽、高、厚度，确认主体变形、底部仍接触地面、左右侧面没有被 artwork 覆盖。

- [ ] **Step 5: 验证桌面和移动布局并记录结果。**

检查桌面右侧设置区滚动不推动左侧预览；调整 ego 视口到移动尺寸，确认页面恢复正常文档滚动、控件不重叠、不截断。若发现具体问题，先复现、补测试、最小修复，再完整回归。

- [ ] **Step 6: 汇总交付证据。**

最终汇报修改文件、自动化命令结果、ego 实际检查结果、任何未覆盖的外部限制；确认未更新 `MEMORY.md`，除非用户另行明确要求。

## 计划自检

- Spec coverage：单图原生 UV、左右侧面隔离、默认抽纸显示、宽高厚度、六项高级变换、模型方向、状态迁移、四区 UI、不新增工艺、材质策略和浏览器验收均已分配到 Task 1–7。
- Placeholder scan：全文无 `TBD`、`TODO` 或未定义的后续动作；每个实现步骤包含目标接口、范围或可运行命令。
- Type consistency：统一使用 `FaceTissueState`、`faceTissue`、`artworkTransform`、`modelRotation`、`showTopSheet` 和 `face-tissue/*`，与前文设计一致。
