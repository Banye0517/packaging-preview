# Hanging Tissue UV and Grounding Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用新供稿模型的四个原生 UV 岛正确映射正背左右，并使悬挂抽纸在任何宽高下保持贴地、居中和完整入画。

**Architecture:** 替换 `public/models/hanging-tissue.gltf` 为新供稿，将四个 UV 岛按模型空间中的三角形位置标注为正、背、左、右，保留原生 `TEXCOORD_0`。渲染层将主体和独立 `纸.1` 节点组合为单个实例，用包围盒将模型水平居中、底部锚定到现有接触阴影平面。

**Tech Stack:** React 19, TypeScript 6, Three.js 0.185, React Three Fiber, Vitest.

---

## 文件边界

- 替换 `public/models/hanging-tissue.gltf`：新供稿模型，项目内 URL 不变。
- 修改 `src/hangingTissue/hangingTissueModel.ts`：节点名称、模型组装和底部锚定数学。
- 修改 `src/hangingTissue/hangingTissueTexture.ts`：原生 UV 岛识别、面标签和四面索引拆分；删除平面 UV 重建。
- 修改 `src/hangingTissue/PrintedHangingTissue.tsx`：适配新 scene 结构、将四张图绘制到一张原生 UV atlas，应用居中与贴地变换。
- 修改 `src/hangingTissue/hangingTissueModelAsset.test.ts`：验证新资产节点和四岛结构。
- 修改 `src/hangingTissue/hangingTissueTexture.test.ts`：保护原生 UV、岛分离和物理面标签。
- 修改 `src/hangingTissue/PrintedHangingTissue.test.ts`：保护新节点寻找与贴地变换。
- 修改 `Tech-Spec.md`、`PRD.md`、`AGENTS.md`：将旧的“法线切面 + UV 重建”替换为已验证的新模型事实。

### Task 1: 用测试锁定新模型合同

**Files:**
- Modify: `src/hangingTissue/hangingTissueModelAsset.test.ts`
- Modify: `src/hangingTissue/PrintedHangingTissue.test.ts`
- Test: `src/hangingTissue/hangingTissueModelAsset.test.ts`
- Test: `src/hangingTissue/PrintedHangingTissue.test.ts`

- [ ] **Step 1: 将资产测试改为新 scene 节点合同**

```ts
expect(asset.nodes.map((node) => node.name)).toEqual(expect.arrayContaining([
  '悬挂抽纸155',
  '悬挂抽纸155-材质.2',
  '悬挂抽纸155-悬挂纸巾',
  '纸.1',
]))
expect(asset.scenes[0].nodes).toEqual([0, 3])
expect(asset.nodes.some((node) => node.name === '悬挂抽纸开')).toBe(false)
```

- [ ] **Step 2: 为底部锚定写失败测试**

```ts
it('centers the model horizontally and moves its minimum y to the local origin', () => {
  const placement = calculateHangingTissuePlacement(
    new Box3(new Vector3(-8, 0.1, -4), new Vector3(8, 39, 4)),
  )
  expect(placement.modelOffset).toEqual(new Vector3(0, -0.1, 0))
  expect(placement.size.y).toBeCloseTo(38.9)
})
```

- [ ] **Step 3: 运行目标测试并确认按预期失败**

Run: `npm run test:run -- src/hangingTissue/hangingTissueModelAsset.test.ts src/hangingTissue/PrintedHangingTissue.test.ts`

Expected: FAIL，旧资产仍有 `悬挂抽纸开`，且 `calculateHangingTissuePlacement` 尚不存在。

- [ ] **Step 4: 替换项目模型资产**

Run: `cp '/Users/banye/Downloads/悬挂纸巾/悬挂纸巾1.gltf' public/models/hanging-tissue.gltf`

Expected: `public/models/hanging-tissue.gltf` 大小约 29 MB，scene 根节点为 `[0, 3]`。

- [ ] **Step 5: 实现最小定位计算**

```ts
export function calculateHangingTissuePlacement(bounds: Box3) {
  const size = bounds.getSize(new Vector3())
  const center = bounds.getCenter(new Vector3())
  return {
    size,
    modelOffset: new Vector3(-center.x, -bounds.min.y, -center.z),
  }
}
```

- [ ] **Step 6: 运行目标测试**

Run: `npm run test:run -- src/hangingTissue/hangingTissueModelAsset.test.ts src/hangingTissue/PrintedHangingTissue.test.ts`

Expected: PASS。

- [ ] **Step 7: 提交模型合同和资产**

```bash
git add public/models/hanging-tissue.gltf src/hangingTissue/hangingTissueModel.ts src/hangingTissue/hangingTissueModelAsset.test.ts src/hangingTissue/PrintedHangingTissue.test.ts
git commit -m "fix: adopt corrected hanging tissue model"
```

### Task 2: 使用原生 UV 岛分离四个印刷面

**Files:**
- Modify: `src/hangingTissue/hangingTissueTexture.ts`
- Modify: `src/hangingTissue/hangingTissueTexture.test.ts`
- Test: `src/hangingTissue/hangingTissueTexture.test.ts`

- [ ] **Step 1: 为四岛分配和原生 UV 保留写失败测试**

```ts
it('maps the four authored UV columns by their physical panel positions', () => {
  const set = extractHangingTissueFaceGeometrySet(createAuthoredIslandGeometry())
  expect(set.faces.front.getIndex()?.getX(0)).toBe(0)
  expect(set.faces.right.getIndex()?.getX(0)).toBe(3)
  expect(set.faces.back.getIndex()?.getX(0)).toBe(6)
  expect(set.faces.left.getIndex()?.getX(0)).toBe(9)
})

it('preserves authored UV coordinates instead of planar remapping', () => {
  const source = createAuthoredIslandGeometry()
  const set = extractHangingTissueFaceGeometrySet(source)
  expect(set.faces.front.getAttribute('uv').array).toEqual(source.getAttribute('uv').array)
})
```

`createAuthoredIslandGeometry()` 创建四个三角形：UV 重心分别位于 `U=0.15/0.40/0.65/0.90`，模型位置分别位于 `+Z/+X/-Z/-X`。

- [ ] **Step 2: 运行测试并确认失败原因**

Run: `npm run test:run -- src/hangingTissue/hangingTissueTexture.test.ts`

Expected: FAIL，旧实现按法线分面并重写 UV。

- [ ] **Step 3: 实现四个供稿 UV 列区间**

```ts
const AUTHORED_UV_ISLANDS = [
  { minU: 0, maxU: 0.31 },
  { minU: 0.31, maxU: 0.5 },
  { minU: 0.5, maxU: 0.8 },
  { minU: 0.8, maxU: 1.01 },
] as const
```

对每个索引三角形计算 UV 重心，将其放入对应列区间。对每个岛累计三角形位置重心，再按主轴标注物理面：

```ts
function faceForIslandPosition(x: number, z: number): HangingTissueFace {
  if (Math.abs(z) >= Math.abs(x)) return z >= 0 ? 'front' : 'back'
  return x >= 0 ? 'right' : 'left'
}
```

- [ ] **Step 4: 克隆几何体时只替换 index，不替换 uv attribute**

```ts
const result = geometry.clone()
result.setIndex(new Uint32BufferAttribute(faceIndices[face], 1))
return [face, result]
```

不再创建 `projectedUv`；不属于四个岛的三角形放入 `remainder`。

- [ ] **Step 5: 运行贴图单元测试**

Run: `npm run test:run -- src/hangingTissue/hangingTissueTexture.test.ts`

Expected: PASS，原生 UV 数值保留，四岛面标签正确。

- [ ] **Step 6: 提交 UV 岛分离实现**

```bash
git add src/hangingTissue/hangingTissueTexture.ts src/hangingTissue/hangingTissueTexture.test.ts
git commit -m "fix: map hanging tissue artwork to authored UV islands"
```

### Task 3: 组装新模型并应用单张四面 atlas

**Files:**
- Modify: `src/hangingTissue/PrintedHangingTissue.tsx`
- Modify: `src/hangingTissue/PrintedHangingTissue.test.ts`
- Test: `src/hangingTissue/PrintedHangingTissue.test.ts`

- [ ] **Step 1: 写新节点结构的失败测试**

```ts
it('uses the corrected body and independent pulled-sheet node names', () => {
  expect(HANGING_TISSUE_BODY_ROOT_NAME).toBe('悬挂抽纸155')
  expect(HANGING_TISSUE_PULLED_SHEET_NAME).toBe('纸.1')
})
```

- [ ] **Step 2: 运行测试并确认常量尚未导出**

Run: `npm run test:run -- src/hangingTissue/PrintedHangingTissue.test.ts`

Expected: FAIL with missing exports。

- [ ] **Step 3: 将新 scene 克隆为单个渲染 group**

```ts
const bodyRoot = scene.getObjectByName(HANGING_TISSUE_BODY_ROOT_NAME)?.clone(true)
const pulledSheet = scene.getObjectByName(HANGING_TISSUE_PULLED_SHEET_NAME)?.clone(true)
if (!bodyRoot || !pulledSheet) throw new Error('Hanging tissue model nodes are incomplete')
const model = new Group()
model.add(bodyRoot, pulledSheet)
```

对 `bodyRoot` 内两个主体网格调用 `extractHangingTissueFaceGeometrySet`，保留四面网格和白色 remainder。

- [ ] **Step 4: 为每个主体创建一张共享四面 atlas**

```ts
drawHangingTissueAtlas(context, 2048, {
  front: frontImage ? { image: frontImage, transform: value.transforms.front } : undefined,
  back: backImage ? { image: backImage, transform: value.transforms.back } : undefined,
  left: leftImage ? { image: leftImage, transform: value.transforms.left } : undefined,
  right: rightImage ? { image: rightImage, transform: value.transforms.right } : undefined,
}, AUTHORED_HANGING_TISSUE_UV_REGIONS)
```

`AUTHORED_HANGING_TISSUE_UV_REGIONS` 使用与模型实际岛边界一致的区域：正面 `0–0.31`、右侧 `0.31–0.5`、背面 `0.5–0.8`、左侧 `0.8–1.0`，V 范围由资产三角形实际边界计算，不把蓝色空区作为可印刷区。

- [ ] **Step 5: 应用居中、底部锚定和现有尺寸缩放**

```tsx
const { size, modelOffset } = calculateHangingTissuePlacement(bounds)
const baseScale = size.y > 0 ? 3.2 / size.y : 1

<group position={[0, -1.87, 0]} rotation={[0, 0, radians]} scale={[scaleX, scaleY, scaleZ]}>
  <primitive object={model} position={modelOffset} />
</group>
```

`-1.87` 是局部补偿：父组在 `Y=0.2`，接触阴影在 `Y=-1.67`，因此模型局部底面应在 `-1.87`。底部锚点在内层模型上，宽高缩放后仍保持最低点不变。

- [ ] **Step 6: 运行悬挂抽纸目标测试**

Run: `npm run test:run -- src/hangingTissue/PrintedHangingTissue.test.ts src/hangingTissue/hangingTissueTexture.test.ts src/hangingTissue/hangingTissueModelAsset.test.ts`

Expected: PASS。

- [ ] **Step 7: 提交渲染与贴地修复**

```bash
git add src/hangingTissue/PrintedHangingTissue.tsx src/hangingTissue/PrintedHangingTissue.test.ts src/hangingTissue/hangingTissueModel.ts
git commit -m "fix: ground and center hanging tissue preview"
```

### Task 4: 回归验证并同步项目文档

**Files:**
- Modify: `PRD.md`
- Modify: `Tech-Spec.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: 运行完整静态和自动化验证**

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors。

Run: `npm run lint`

Expected: PASS with no ESLint errors。

Run: `npm run test:run`

Expected: PASS with all Vitest suites green。

Run: `npm run build`

Expected: PASS，并生成 `dist/client/index.html`、`dist/server/index.js`、`dist/.openai/hosting.json`。

Run: `npm run test:sites`

Expected: PASS。

- [ ] **Step 2: 启动本地预览并使用真实浏览器验收**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite 输出实际本地 URL。在独立新浏览器标签页打开该 URL，避免覆盖用户已有页面。

验收路径：

1. 选择“悬挂抽纸”，确认产品底面与阴影接触。
2. 上传四张明显不同的正、背、左、右测试图，旋转 360°，确认四面不串位、不进入内部、顶部或底部。
3. 放大到 OrbitControls 最小距离，确认产品仍完整入画。
4. 将宽、高调到最小和最大值，确认底面始终贴地。
5. 切换 `纸.1`，确认只有抽出纸张显隐。
6. 在 390×844 视口重复上传、旋转和缩放主要流程。

- [ ] **Step 3: 用最终事实更新文档**

`PRD.md`、`Tech-Spec.md`、`AGENTS.md` 统一记录：新模型节点结构、四个原生 UV 岛的面顺序、岛分离方法、底部锚定与真实验收结果。删除“原生 UV 重叠”和“重建平面 UV”的旧描述。

- [ ] **Step 4: 提交文档和最终验收状态**

```bash
git add PRD.md Tech-Spec.md AGENTS.md
git commit -m "docs: record corrected hanging tissue mapping"
```

