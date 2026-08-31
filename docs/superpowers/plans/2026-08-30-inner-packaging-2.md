# 内包装2实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增使用 `翅中.gltf` 原生 UV 的“内包装2”，支持正反面独立上传、等比缩放、移动、旋转和模型宽高/方向控制。

**Architecture:** 项目状态新增版本10的 `innerPackaging2`。渲染层保留 glTF 唯一网格和原生 UV，将正面图片合成到纹理左半区、背面图片合成到右半区；每面在独立局部画布中变换和裁切。UI复用现有上传卡片和内包装尺寸控件，但使用专属双面状态与动作，避免影响内包装1。

**Tech Stack:** React 19、TypeScript、Three.js、React Three Fiber、Vitest、Testing Library、Vite。

---

### Task 1: 固定模型资源和项目状态合同

**Files:**
- Create: `public/models/inner-packaging-2.gltf`
- Modify: `src/app/types.ts`
- Modify: `src/app/projectReducer.ts`
- Test: `src/innerPackaging/innerPackaging2ModelAsset.test.ts`
- Test: `src/app/projectReducer.test.ts`

- [ ] **Step 1: 写失败测试**

模型测试读取 glTF，断言只有一个名为“翅中”的网格、primitive 含 `POSITION`、`NORMAL`、`TEXCOORD_0`，UV accessor 范围跨过 0.5 且保持在 0–1。Reducer 测试断言初始项目存在 `innerPackaging2.faces.front/back` 和每面默认变换；正面上传、移除、变换、重置不修改背面；宽高必须为正数；模型方向仅接受 0/90/180。

- [ ] **Step 2: 验证测试因功能缺失而失败**

Run: `npm run test:run -- src/innerPackaging/innerPackaging2ModelAsset.test.ts src/app/projectReducer.test.ts`

Expected: FAIL，原因是模型文件、`innerPackaging2` 状态和 action 尚不存在。

- [ ] **Step 3: 实现最小状态合同**

在 `types.ts` 新增：

```ts
export interface ArtworkTransform {
  scale: number
  offsetX: number
  offsetY: number
  rotation: number
}

export interface InnerPackaging2State {
  faces: Record<PouchFace, ArtworkAsset | null>
  transforms: Record<PouchFace, ArtworkTransform>
  selectedFace: PouchFace
  width: number
  height: number
  modelRotation: InnerPackagingModelRotation
}
```

将 `PackagingType` 增加 `'inner-packaging-2'`，`ProjectState.version` 改为10并加入 `innerPackaging2`。Reducer 增加 `inner-packaging-2/face-set`、`face-remove`、`select-face`、`transform-set`、`transform-reset`、`set`、`rotation-set`；变换范围为 scale 50–300、offset -100–100、rotation -180–180。

- [ ] **Step 4: 复制提供的模型并验证测试通过**

Copy: `/Users/banye/Downloads/包装袋1/包装袋1/翅中/翅中.gltf` → `public/models/inner-packaging-2.gltf`

Run: `npm run test:run -- src/innerPackaging/innerPackaging2ModelAsset.test.ts src/app/projectReducer.test.ts`

Expected: PASS。

### Task 2: 版本10保存、校验和旧项目迁移

**Files:**
- Modify: `src/project/codec.ts`
- Test: `src/project/codec.test.ts`

- [ ] **Step 1: 写失败测试**

增加测试：版本10可往返保存正反素材和两面变换；版本9加载后补齐默认 `innerPackaging2`；非法 selectedFace、变换范围、额外 face key 或非法模型方向被拒绝。

- [ ] **Step 2: 验证迁移测试失败**

Run: `npm run test:run -- src/project/codec.test.ts`

Expected: FAIL，原因是 codec 仍只接受版本9。

- [ ] **Step 3: 实现版本10 codec**

新增 `hasInnerPackaging2Fields()` 精确校验 front/back 键、素材、变换和尺寸。版本9项目迁移为版本10并注入 `createDefaultInnerPackaging2()`；版本10直接校验后返回。保留版本1–8既有迁移链，最终统一得到版本10。

- [ ] **Step 4: 验证 codec 通过**

Run: `npm run test:run -- src/project/codec.test.ts`

Expected: PASS。

### Task 3: 独立双面上传与变换面板

**Files:**
- Create: `src/innerPackaging/InnerPackaging2ArtworkUploader.tsx`
- Create: `src/innerPackaging/InnerPackaging2ArtworkUploader.test.tsx`
- Modify: `src/innerPackaging/InnerPackaging1Panel.tsx`
- Modify: `src/innerPackaging/InnerPackaging1Panel.test.tsx`

- [ ] **Step 1: 写失败组件测试**

断言面板只呈现正面、背面两个上传入口；点击面卡选择对应面；选中正面时控制值来自 `transforms.front`；滑块触发 `(front, key, value)`；重置只发送 front；没有水平/垂直拉伸控件。尺寸面板增加可传标题和说明，内包装1默认文案保持不变，内包装2显示对应标题。

- [ ] **Step 2: 验证组件测试失败**

Run: `npm run test:run -- src/innerPackaging/InnerPackaging2ArtworkUploader.test.tsx src/innerPackaging/InnerPackaging1Panel.test.tsx`

Expected: FAIL，原因是双面上传组件不存在且尺寸面板尚不可定制标题。

- [ ] **Step 3: 实现双面上传组件**

复用 `FaceUploader` 和现有数字/滑块交互，props 明确为：

```ts
interface InnerPackaging2ArtworkUploaderProps {
  value: InnerPackaging2State
  errors: Partial<Record<PouchFace, string>>
  onUpload: (face: PouchFace, file: File) => void
  onRemove: (face: PouchFace) => void
  onSelectFace: (face: PouchFace) => void
  onTransformChange: (face: PouchFace, key: keyof ArtworkTransform, value: number) => void
  onTransformReset: (face: PouchFace) => void
}
```

只提供缩放、水平位置、垂直位置、旋转四项；不提供 stretch。

- [ ] **Step 4: 验证组件测试通过**

Run: `npm run test:run -- src/innerPackaging/InnerPackaging2ArtworkUploader.test.tsx src/innerPackaging/InnerPackaging1Panel.test.tsx`

Expected: PASS。

### Task 4: 原生 UV 双面纹理合成与3D模型

**Files:**
- Create: `src/innerPackaging/innerPackaging2Texture.ts`
- Create: `src/innerPackaging/innerPackaging2Texture.test.ts`
- Create: `src/innerPackaging/PrintedInnerPackaging2.tsx`
- Create: `src/innerPackaging/PrintedInnerPackaging2.test.ts`
- Modify: `src/scene/BoxScene.tsx`

- [ ] **Step 1: 写失败纹理和模型测试**

将画布绘制逻辑抽成可注入 2D context 的纯函数。测试正面 clip/draw 只落在 x=0–512，背面只落在 x=512–1024；图片按 `min(panelWidth/imageWidth, panelHeight/imageHeight) * scale` 等比绘制；offset 和 rotation 在各自半区中心计算。模型测试断言资源 URL、唯一网格提取、原生 UV 保留、模型方向应用到完整 group。

- [ ] **Step 2: 验证测试失败**

Run: `npm run test:run -- src/innerPackaging/innerPackaging2Texture.test.ts src/innerPackaging/PrintedInnerPackaging2.test.ts`

Expected: FAIL，原因是纹理合成器和渲染组件不存在。

- [ ] **Step 3: 实现合成器和模型组件**

`drawInnerPackaging2Atlas()` 先填充白色，再逐面执行 `save → beginPath → rect(half) → clip → translate(half center + offset) → rotate → drawImage(aspect-fit dimensions) → restore`。`PrintedInnerPackaging2` 加载 `/models/inner-packaging-2.gltf`，克隆唯一网格 geometry、应用世界矩阵和模型朝向修正，使用 `fitPouchGeometry` 只拟合宽高，创建 `CanvasTexture`，设置 `SRGBColorSpace`、`flipY=false`，并在变换或图片变化时释放旧纹理。

- [ ] **Step 4: 接入场景并验证测试通过**

`BoxScene` 明确分支：box、pouch、inner-packaging-1、inner-packaging-2。Run: `npm run test:run -- src/innerPackaging/innerPackaging2Texture.test.ts src/innerPackaging/PrintedInnerPackaging2.test.ts`

Expected: PASS。

### Task 5: App 接入、文案和完整行为

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `AGENTS.md`
- Modify: `PRD.md`
- Modify: `Tech-Spec.md`
- Modify: `acceptance-matrix.md`

- [ ] **Step 1: 写失败 App 测试**

断言盒型列表包含“内包装2”；切换后贴图标题为“内包装2印刷贴图”且只有正背上传；盒型页显示“内包装2设置”；工艺页显示“内包装2暂不支持表面工艺”；新建/打开会清理内包装2错误状态。

- [ ] **Step 2: 验证 App 测试失败**

Run: `npm run test:run -- src/app/App.test.tsx`

Expected: FAIL，原因是 App 尚未接入新盒型。

- [ ] **Step 3: 实现 App 数据流**

新增每面错误状态、上传/移除 handlers、四项变换 dispatch、宽高/方向 dispatch。更新包装类型 switch、贴图分支、盒型分支、工艺不可用文案、帮助文案和“新建项目”包装数量。

- [ ] **Step 4: 更新持久文档并验证 App 测试通过**

在项目文档记录内包装2的资源、左右 UV、双面独立变换和无工艺规则。Run: `npm run test:run -- src/app/App.test.tsx`

Expected: PASS。

### Task 6: 完整回归和真实浏览器验收

**Files:**
- Modify: `acceptance-matrix.md`

- [ ] **Step 1: 运行完整自动化验证**

Run independently:

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
npm run test:sites
```

Expected: 全部退出码0；生产构建生成 `dist/client/index.html`、`dist/server/index.js`、`dist/.openai/hosting.json`。

- [ ] **Step 2: 准备正背高对比测试图**

生成保持宽高比可辨识的红色“FRONT”图和蓝色“BACK”图，作为本地浏览器上传输入。

- [ ] **Step 3: 真实浏览器验收**

在独立测试标签打开本地预览，选择内包装2，分别上传正背测试图。检查模型正面为红色、旋转到背面为蓝色；修改正面旋转/缩放/位置后背面不动且图片不形变；未覆盖区域白色；宽高和模型方向生效；根页面 `scrollY` 保持0；控制台无 error。

- [ ] **Step 4: 回归已有包装并记录通过**

切换六面盒、自立袋、内包装1，确认其上传入口、3D模型和工艺可用性未改变。将 acceptance matrix 新增项目标记为 passed，并保留完成状态的浏览器标签供用户查看。
