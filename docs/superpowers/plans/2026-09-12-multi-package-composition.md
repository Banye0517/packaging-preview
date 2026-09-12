# 多包装组合实施计划

> **执行要求：** 实施时必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，逐项完成下面的复选步骤。

**目标：** 实现一至六个独立包装实例、四种全落地自动排列、真实尺寸间距、组合相机取景、实例选择、项目保存和完整 PNG 导出。

**架构：** 将 version 17 的单包装根状态升级为 version 18 的 `PackageInstance[]`。现有包装编辑逻辑下沉为单实例 reducer，项目 reducer 只管理添加、选择、删除和排列；Three.js 场景测量每个模型的世界空间边界，再交给纯函数布局引擎计算落地位置、间距和组合边界。

**技术栈：** React 19、TypeScript 6、React Three Fiber 9、Three.js 0.185、Drei 10、Vitest、Testing Library、Vite 8。

---

## 文件职责

- `src/app/types.ts`：version 18、包装实例和排列类型。
- `src/app/packageFactory.ts`：创建实例、复制结构、清空素材和生成显示名称。
- `src/app/packageReducer.ts`：现有单包装编辑逻辑。
- `src/app/projectReducer.ts`：组合级添加、选择、删除、排列和全局相机状态。
- `src/project/codec.ts`：version 18 校验及 version 1–17 迁移。
- `src/composition/layout.ts`：纯函数 A/B/C/D 布局、落地和防碰撞。
- `src/composition/PackageInstanceView.tsx`：单实例模型路由、边界测量、3D 点击选择。
- `src/composition/PackageModelErrorBoundary.tsx`：隔离单个 GLTF 加载失败。
- `src/composition/CompositionControls.tsx`：实例列表、添加、删除和排列选择。
- `src/scene/fitCompositionCamera.ts`：组合相机取景计算。
- `src/scene/BoxScene.tsx`：共享灯光下渲染完整组合。
- `src/app/App.tsx`：把现有四个面板绑定到当前实例。
- `src/styles.css`：桌面和移动端组合控件。

不得修改 `.openai/hosting.json`、`worker/index.js`、`scripts/prepare-sites-build.mjs` 和 `tests/sites-worker.test.mjs`。

### 任务 1：建立包装实例类型和工厂

**文件：** 修改 `src/app/types.ts`；新建 `src/app/packageFactory.ts`、`src/app/packageFactory.test.ts`。

- [ ] **步骤 1：先写失败测试**

```ts
it('copies dimensions but clears artwork and finish masks', () => {
  const source = createPackageInstance('box', 'box-1')
  source.box.width = 260
  source.faces.front = TEST_ARTWORK
  source.boxFinish.layers['gold-foil'].masks.front = {
    asset: TEST_ARTWORK,
    transform: { scale: 100, offsetX: 0, offsetY: 0, rotation: 0 },
  }
  const copy = clonePackageForAdd(source, 'box-2')
  expect(copy.box.width).toBe(260)
  expect(copy.faces.front).toBeNull()
  expect(copy.boxFinish.layers['gold-foil'].masks.front).toBeNull()
})
```

- [ ] **步骤 2：运行 `npm test -- --run src/app/packageFactory.test.ts`。** 预期因模块不存在而失败。

- [ ] **步骤 3：定义 version 18 根状态。**

```ts
export type CompositionLayout = 'hero' | 'family' | 'cluster' | 'grid'
export interface PackageInstance {
  id: string
  packagingType: PackagingType
  manualTransform: null
  faces: Record<BoxFace, ArtworkAsset | null>
  box: { width: number; height: number; depth: number; radius: number }
  pouch: PouchState
  innerPackaging1: InnerPackaging1State
  innerPackaging2: InnerPackaging2State
  hangingTissue: HangingTissueState
  faceTissue: FaceTissueState
  wetTissue: WetTissueState
  washTissue: FaceTissueState
  boxFinish: import('../finish/finishTypes').BoxFinishState
  pouchFinish: import('../finish/finishTypes').PouchFinishState
}
export interface ProjectState {
  version: 18
  name: string
  activeTab: 'artwork' | 'finish' | 'box' | 'camera'
  instances: PackageInstance[]
  selectedInstanceId: string
  layout: CompositionLayout
  heroInstanceId: string | null
  camera: { autoRotate: boolean; lightingIntensity: number }
}
```

- [ ] **步骤 4：实现实例工厂。** `createPackageInstance` 复用现有默认值；`clonePackageForAdd` 使用 `structuredClone` 复制尺寸、结构、旋转、开合和纸张状态，再把所有图稿和工艺蒙版设为 `null`。`manualTransform` 固定为 `null`，首版不读取。

- [ ] **步骤 5：重跑测试，预期 PASS；提交。**

```bash
git add src/app/types.ts src/app/packageFactory.ts src/app/packageFactory.test.ts
git commit -m "feat: add independent package instances"
```

### 任务 2：把现有编辑动作绑定到当前实例

**文件：** 新建 `src/app/packageReducer.ts`；修改 `src/app/projectReducer.ts`、`src/app/projectReducer.test.ts`、`src/app/projectHistory.test.ts`。

- [ ] **步骤 1：添加失败测试。**

```ts
it('edits only the selected instance', () => {
  const two = projectReducer(createInitialProject(), {
    type: 'instance/add', packagingType: 'box', id: 'box-2',
  })
  const changed = projectReducer(two, {
    type: 'package/edit', action: { type: 'box/set', key: 'width', value: 280 },
  })
  expect(changed.instances[0].box.width).toBe(160)
  expect(changed.instances[1].box.width).toBe(280)
})
```

同时覆盖：新增后自动选中、2/3–4/5–6 分别推荐 B/C/D、第七个不能添加、最后一个不能删除、删除后选择相邻实例、A 记录当前主品。

- [ ] **步骤 2：运行 `npm test -- --run src/app/projectReducer.test.ts src/app/projectHistory.test.ts`。** 预期因缺少组合动作而失败。

- [ ] **步骤 3：抽出单实例 reducer。** 把现有图稿、工艺和盒型 switch case 移入 `packageReducer.ts`，状态改为 `PackageInstance`；移除旧 `packaging/type` 和全局相机动作。

- [ ] **步骤 4：实现组合动作。**

```ts
export type ProjectAction =
  | { type: 'instance/add'; packagingType: PackagingType; id: string }
  | { type: 'instance/select'; id: string }
  | { type: 'instance/remove'; id: string }
  | { type: 'layout/set'; value: CompositionLayout }
  | { type: 'package/edit'; action: PackageAction }
  | { type: 'camera/autoRotate'; value: boolean }
  | { type: 'camera/lightingIntensity'; value: number }
export function recommendedLayout(count: number): CompositionLayout {
  if (count <= 2) return 'family'
  if (count <= 4) return 'cluster'
  return 'grid'
}
```

添加和删除重新采用推荐排列；尺寸编辑不改变当前排列；`layout/set` 切入 `hero` 时把当前实例记为主品。

- [ ] **步骤 5：重跑 reducer/history 测试，预期 PASS；提交。**

```bash
git add src/app/packageReducer.ts src/app/projectReducer.ts src/app/projectReducer.test.ts src/app/projectHistory.test.ts
git commit -m "feat: manage package composition state"
```

### 任务 3：保存 version 18 并迁移旧项目

**文件：** 修改 `src/project/codec.ts`、`src/project/codec.test.ts`。

- [ ] **步骤 1：添加失败测试。** 覆盖两个独立实例 round-trip，以及 version 17 的 `wet-tissue` 项目迁移为一个 ID 固定为 `package-1` 的实例。
- [ ] **步骤 2：运行 `npm test -- --run src/project/codec.test.ts`。** 预期当前 codec 只接受 version 17，测试失败。
- [ ] **步骤 3：增加 version 18 校验。** 校验一至六个实例、ID 非空且唯一、选中 ID 存在、主品 ID 为 `null` 或存在、排列值合法、`manualTransform === null`、全局相机合法，并复用现有字段校验验证每个实例。
- [ ] **步骤 4：增加确定性迁移。** 保留 version 1–17 迁移链；把最终旧根包装字段包装为一个实例；解码过程不得调用 `crypto.randomUUID()`。
- [ ] **步骤 5：重跑 codec 测试，预期所有新旧 fixture PASS；提交。**

```bash
git add src/project/codec.ts src/project/codec.test.ts
git commit -m "feat: persist multi-package projects"
```

### 任务 4：实现全落地自动布局引擎

**文件：** 新建 `src/composition/layout.ts`、`src/composition/layout.test.ts`。

- [ ] **步骤 1：写四种排列失败测试。** 对 A/B/C/D 断言 `positionY + minY === 0`、不存在 X/Z 交叠、组合中心为 0、输入顺序稳定；再覆盖 A 主品、B 两个、C 三至四个、D 五至六个和尺寸变宽后的自动让位。
- [ ] **步骤 2：运行 `npm test -- --run src/composition/layout.test.ts`。** 预期因模块不存在而失败。
- [ ] **步骤 3：实现确定性布局。** 模块只使用数字 tuple，不依赖 React/Three.js。安全间距为：

```ts
const gap = Math.max(0.12, Math.min(0.45, averageHeight * 0.08))
```

B 为单排；C 使用浅前后错位；D 每排最多三个；A 把 `heroInstanceId` 放中心并对称分配其他实例。所有 Y 为 `-bounds.min[1]`。模板初排后按稳定顺序消除 X/Z 包围盒交叠，再把组合 X/Z 中心平移到原点；不得修改缩放和尺寸。

- [ ] **步骤 4：重跑 layout 测试，预期 PASS；提交。**

```bash
git add src/composition/layout.ts src/composition/layout.test.ts
git commit -m "feat: add grounded composition layouts"
```

### 任务 5：渲染、测量并隔离单个包装实例

**文件：** 新建 `src/composition/PackageInstanceView.tsx`、`src/composition/PackageInstanceView.test.tsx`、`src/composition/PackageModelErrorBoundary.tsx`。

- [ ] **步骤 1：写失败测试。** Mock 全部 `Printed*` 组件，验证八种类型路由、点击回传 ID、只有当前实例显示选中边框、首次稳定边界标记 ready、单模型异常不会让 Canvas 崩溃。
- [ ] **步骤 2：运行 `npm test -- --run src/composition/PackageInstanceView.test.tsx`。** 预期因组件不存在而失败。
- [ ] **步骤 3：实现路由和状态隔离。** 外层 group 应用布局位置/yaw；内部 group 用于测量。添加 `onPointerDown`、`stopPropagation()` 和 pointer cursor。用 `Suspense` 与错误边界分别回传 `loading`、`ready`、`error`。
- [ ] **步骤 4：报告稳定局部边界。** 使用 `Box3.setFromObject`；六个数变化超过 `0.001` 才回调。尺寸和开合变化后重测，图稿变化不触发布局。选中时按局部边界绘制细线框。
- [ ] **步骤 5：重跑测试，预期 PASS；提交。**

```bash
git add src/composition/PackageInstanceView.tsx src/composition/PackageInstanceView.test.tsx src/composition/PackageModelErrorBoundary.tsx
git commit -m "feat: render selectable package instances"
```

### 任务 6：按组合边界调整相机

**文件：** 新建 `src/scene/fitCompositionCamera.ts`、`src/scene/fitCompositionCamera.test.ts`；修改 `src/scene/cameraLimits.ts`。

- [ ] **步骤 1：写失败测试。** 覆盖方形/宽屏视口、单个高包装、六个横向包装和距离上下限；所有角点必须处于横纵 FOV 的 12% 安全边距内。
- [ ] **步骤 2：运行 `npm test -- --run src/scene/fitCompositionCamera.test.ts`。** 预期因模块不存在而失败。
- [ ] **步骤 3：实现纯相机计算。**

```ts
const verticalDistance = halfHeight / Math.tan(verticalFov / 2)
const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect)
const horizontalDistance = halfWidth / Math.tan(horizontalFov / 2)
const distance = Math.max(verticalDistance, horizontalDistance) * 1.12 + halfDepth
```

函数返回 `position`、`target`、`near`、`far`，不直接改相机。自动重排保留当前观察方位；正视图使用前方；重置改为当前组合推荐斜视取景。

- [ ] **步骤 4：重跑测试，预期 PASS；提交。**

```bash
git add src/scene/fitCompositionCamera.ts src/scene/fitCompositionCamera.test.ts src/scene/cameraLimits.ts
git commit -m "feat: fit camera to package compositions"
```

### 任务 7：在共享场景渲染完整组合

**文件：** 修改 `src/scene/BoxScene.tsx`、`src/scene/BoxScene.test.tsx`。

- [ ] **步骤 1：改写组合失败测试。** Mock `PackageInstanceView`，断言两个实例同时渲染、边界回调后位置不同、3D 点击选择正确 ID、接触阴影覆盖组合边界。
- [ ] **步骤 2：运行 `npm test -- --run src/scene/BoxScene.test.tsx`。** 预期当前单类型分支导致失败。
- [ ] **步骤 3：接入测量和布局。** Props 增加选择与加载状态回调；用 `Map<string, LayoutBounds>` 保存边界。新增模型未 ready 前保留旧组合并隐藏新模型，禁止暂放原点；失败实例从布局排除，并通知 App 显示错误后移除 pending 实例。
- [ ] **步骤 4：接入相机和接触阴影。** 只在添加、删除、尺寸或结构边界变化后 fit，不因图稿变化或每帧渲染跳相机。接触阴影固定地面并覆盖组合跨度；保留 `product-contact-shadow` 名称。
- [ ] **步骤 5：运行 `npm test -- --run src/scene/BoxScene.test.tsx src/export/transparentPng.test.ts`，预期 PASS；提交。**

```bash
git add src/scene/BoxScene.tsx src/scene/BoxScene.test.tsx
git commit -m "feat: render grounded package compositions"
```

### 任务 8：添加组合控制，不新增第五个设置区

**文件：** 新建 `src/composition/CompositionControls.tsx`、`src/composition/CompositionControls.test.tsx`；修改 `src/styles.css`。

- [ ] **步骤 1：写交互失败测试。** 断言实例列表、八种 `+`、六个时禁用、一个时隐藏排列、两个以上显示 A/B/C/D、当前/加载/错误状态、最后一个删除禁用及全部回调。
- [ ] **步骤 2：运行 `npm test -- --run src/composition/CompositionControls.test.tsx`。** 预期因组件不存在而失败。
- [ ] **步骤 3：实现无障碍控件。** 实例行由选择和删除两个按钮组成；添加按钮使用明确 `aria-label`；达到六个显示“最多添加 6 个包装”。排列使用 `composition-layout` radio，并显示系统推荐值。
- [ ] **步骤 4：补充响应式样式。** 桌面保持左侧固定和右侧滚动；移动端恢复文档滚动。列表允许换行，触点至少 44 CSS px。
- [ ] **步骤 5：重跑测试，预期 PASS；提交。**

```bash
git add src/composition/CompositionControls.tsx src/composition/CompositionControls.test.tsx src/styles.css
git commit -m "feat: add composition controls"
```

### 任务 9：把现有四个面板接到当前实例

**文件：** 修改 `src/app/App.tsx`、`src/app/App.test.tsx`、`src/artwork/validateImage.ts`、`src/artwork/validateImage.test.ts`。

- [ ] **步骤 1：写 App 失败测试。** 覆盖不同/相同盒型添加、双入口选择、独立尺寸/图稿、四种排列、删除、六个上限；900×1600 返回非阻断清晰度提示，1200×1600 不提示，两者均可上传。
- [ ] **步骤 2：运行 `npm test -- --run src/app/App.test.tsx src/artwork/validateImage.test.ts`。** 预期因 App 仍读根包装字段而失败。
- [ ] **步骤 3：统一路由当前实例。**

```ts
const project = history.present
const activePackage = getSelectedInstance(project)
function commitPackage(action: PackageAction) {
  historyDispatch({ type: 'commit', action: { type: 'package/edit', action } })
}
```

所有包装状态改读 `activePackage`；`project.camera` 保持全局；所有上传和设置动作经过 `commitPackage`。

- [ ] **步骤 4：隔离错误和低分辨率提示。** 使用 `Record<string, InstanceErrors>`。任一图片边小于 1024px 时提示“图片分辨率较低，高清导出可能模糊”，但不得拒绝文件或修改几何体。
- [ ] **步骤 5：挂载组合控件和模型状态。** 用 `crypto.randomUUID()` 生成新增 ID；列表与 3D 共用选择动作；模型错误显示后移除失败 pending 实例且不改变旧组合；删除旧 `PackagingTypeSwitch`。
- [ ] **步骤 6：更新帮助文案。** 说明 `+`、六个上限、自动排列、当前实例、真实尺寸间距和禁止悬空；新建确认改为清空全部组合数据。
- [ ] **步骤 7：重跑测试，预期 PASS；提交。**

```bash
git add src/app/App.tsx src/app/App.test.tsx src/artwork/validateImage.ts src/artwork/validateImage.test.ts
git commit -m "feat: edit selected package instances"
```

### 任务 10：完整回归和真实浏览器验收

**文件：** 只修改验证中确认有问题的本次相关文件。

- [ ] **步骤 1：运行全部自动检查。**

```bash
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run test:sites
```

预期全部 exit 0，且构建保留 `dist/client/index.html`、`dist/server/index.js`、`dist/.openai/hosting.json`。

- [ ] **步骤 2：桌面验收。** 验证 1 个无排列、2 个 B、3–4 个 C、5–6 个 D、四种手动切换、六个上限、不同/相同类型、双入口选择、尺寸重排、全部落地、无穿插、完整取景和右侧独立滚动。
- [ ] **步骤 3：在 390×844 移动端验收。** 验证正常文档滚动、完整取景、控件换行、44px 触点和主要操作无遮挡。
- [ ] **步骤 4：保存和导出验收。** 建立含两个同类不同图稿的六包装组合；保存重开后核对 ID、选中项、排列、尺寸和图稿；导出 800/3000px 有/无投影 PNG，确认透明、完整、落地。
- [ ] **步骤 5：阴影回归。** 组合全部高密度类型，确认仍投影但不出现三角剖分自阴影条纹。
- [ ] **步骤 6：仅在发现并修复问题时提交。**

```bash
git add -p src
git commit -m "fix: complete composition verification"
```

若没有修复内容则跳过此提交。
