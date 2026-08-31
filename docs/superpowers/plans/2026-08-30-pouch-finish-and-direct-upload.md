# 自立袋工艺与直接上传 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让工艺蒙版空框直接上传，并给自立袋的正反两个印刷面加入五种独立工艺。

**Architecture:** 将工艺状态抽成按面集合参数化的通用状态；盒型继续使用六面状态，自立袋使用正反两面状态。自立袋复用现有蒙版、膜纹理和材质计算，只在 `front` 与 `back` 分区网格上渲染覆盖层。

**Tech Stack:** React 19、TypeScript、React Three Fiber、Three.js、Vitest、Testing Library。

---

### Task 1: 工艺状态、reducer 与项目文件兼容

**Files:**
- Modify: `src/finish/finishTypes.ts`
- Modify: `src/app/types.ts`
- Modify: `src/app/projectReducer.ts`
- Modify: `src/app/projectReducer.test.ts`
- Modify: `src/project/codec.ts`
- Modify: `src/project/codec.test.ts`

- [ ] **Step 1: 写出失败测试**

```ts
it('stores a pouch finish mask independently from box masks', () => {
  const project = createInitialProject()
  const next = projectReducer(project, {
    type: 'pouch-finish/mask-set', kind: 'gold-foil', face: 'front', asset,
  })
  expect(next.pouchFinish.layers['gold-foil'].masks.front?.asset).toEqual(asset)
  expect(next.boxFinish.layers['gold-foil'].masks.front).toBeNull()
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- --run src/app/projectReducer.test.ts`

Expected: FAIL，因为 `pouchFinish` 与 `pouch-finish/mask-set` 尚不存在。

- [ ] **Step 3: 最小实现**

```ts
export type PouchFinishState = FinishState<PouchFace>
export function createDefaultPouchFinish(): PouchFinishState {
  return createDefaultFinish(['front', 'back'], 'front')
}
```

在 `ProjectState` 加入 `version: 9` 与 `pouchFinish`；为 `pouch-finish/*` 增加与 `box-finish/*` 对应的动作，并把 version 8 项目迁移为 `pouchFinish: createDefaultPouchFinish()`。

- [ ] **Step 4: 运行状态与编解码测试**

Run: `npm test -- --run src/app/projectReducer.test.ts src/project/codec.test.ts`

Expected: PASS。

### Task 2: 工艺面板与直接点击上传

**Files:**
- Modify: `src/finish/FinishPanel.tsx`
- Modify: `src/finish/FinishPanel.test.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: 写出失败测试**

```tsx
it('uses the empty plus tile itself as the upload label', () => {
  render(<FinishPanel value={createDefaultBoxFinish()} faces={BOX_FACES} labels={labels} errors={{}} onAction={vi.fn()} />)
  expect(screen.getByText('＋').closest('label')).toHaveAttribute('for', 'finish-gold-foil-top')
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- --run src/finish/FinishPanel.test.tsx`

Expected: FAIL，因为空面当前由按钮承载，独立的“上传”标签才连接文件输入。

- [ ] **Step 3: 最小实现**

```tsx
{mask ? <button className="finish-face-select" type="button">…</button> :
  <label className="finish-face-select" htmlFor={inputId}><strong>{label}</strong><span>＋</span></label>}
```

面板接收当前可用面与标签。`App` 在盒型传六面状态，在袋型传正反状态并保留内包装1“不支持”提示；袋装上传使用相同本地图片校验和独立错误状态。

- [ ] **Step 4: 运行面板测试**

Run: `npm test -- --run src/finish/FinishPanel.test.tsx src/app/App.test.tsx`

Expected: PASS。

### Task 3: 自立袋 3D 工艺覆盖层

**Files:**
- Modify: `src/finish/FinishOverlay.tsx`
- Create: `src/finish/PouchFinishOverlay.tsx`
- Create: `src/finish/PouchFinishOverlay.test.ts`
- Modify: `src/pouch/pouchModelGeometry.ts`
- Modify: `src/pouch/PrintedPouch.tsx`
- Modify: `src/scene/BoxScene.tsx`

- [ ] **Step 1: 写出失败测试**

```ts
it('returns only enabled pouch front and back masks', () => {
  const finish = createDefaultPouchFinish()
  finish.layers['gold-foil'].masks.front = mask
  expect(getActiveFinishFaces(finish, ['front', 'back'])).toEqual([{ kind: 'gold-foil', face: 'front' }])
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- --run src/finish/PouchFinishOverlay.test.ts`

Expected: FAIL，因为当前帮助函数与覆盖层只接收盒型六面。

- [ ] **Step 3: 最小实现**

```tsx
{(['front', 'back'] as const).map((face) => {
  const mask = layer.masks[face]
  return mask ? <mesh geometry={parts[face]} scale={scale}>…</mesh> : null
})}
```

导出袋装分区几何类型。每一已启用的蒙版覆盖在对应 panel 上，复用 `loadInvertedFinishMask`、`getFinishMaterialProps` 和固定膜纹理；结构分区不传入覆盖层。

- [ ] **Step 4: 运行覆盖层测试**

Run: `npm test -- --run src/finish/FinishOverlay.test.ts src/finish/PouchFinishOverlay.test.ts src/pouch/pouchModelGeometry.test.ts`

Expected: PASS。

### Task 4: 合同、验证与浏览器验收

**Files:**
- Modify: `PRD.md`
- Modify: `Tech-Spec.md`
- Modify: `acceptance-matrix.md`

- [ ] **Step 1: 更新合同**

在 PRD、Tech Spec 与验收矩阵中将“工艺仅适用于盒型”改为“盒型六面、自立袋正反两面”，明确袋装结构面不参与工艺。

- [ ] **Step 2: 完整验证**

Run: `npm run typecheck && npm run lint && npm test -- --run && npm run build && npm run test:sites && git diff --check`

Expected: 所有命令通过；若当前目录不是 Git 仓库，记录该限制并跳过最后一项。

- [ ] **Step 3: 真实浏览器验收**

启动 Vite，分别在桌面与 390×844 视口检查：点击盒型空“＋”工艺框触发选择器；自立袋工艺页仅显示正/背面；上传后正反视图存在工艺差异，且封边与风琴底未被覆盖。
