# 六面盒表面工艺 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变现有贴图、盒型、相机及两类袋体行为的前提下，为六面盒加入五种可叠加、可变换蒙版的实时表面工艺。

**Architecture:** `src/finish/` 独立负责工艺类型、默认参数、面板、蒙版变换和材质覆盖；`ProjectState.boxFinish` 保存可撤销、可序列化的状态。`PrintedBox` 保留基础六面材质，再按面渲染非空工艺覆盖层，预览与导出共用同一 Three.js 场景和纹理矩阵。

**Tech Stack:** React 19、TypeScript、React Three Fiber、Three.js、Vitest、Testing Library、Vite。

---

## 文件结构

- `src/finish/finishTypes.ts`：五种工艺、参数、默认状态和范围。
- `src/finish/finishTexture.ts`：黑白蒙版纹理加载、颜色空间和变换矩阵。
- `src/finish/FinishPanel.tsx`：工艺卡、开关、参数和六面蒙版 UI。
- `src/finish/FinishFaceGrid.tsx`：六面上传、选中面和贴图变换控件。
- `src/finish/FinishOverlay.tsx`：单面的工艺材质覆盖层。
- `src/finish/*.test.ts(x)`：状态、交互、纹理和材质合同。
- `src/app/types.ts`、`projectReducer.ts`：项目状态和动作。
- `src/project/codec.ts`：版本升级与序列化兼容。
- `src/app/App.tsx`：上传处理和工艺面板接线。
- `src/scene/PrintedBox.tsx`：基础材质之外挂载工艺层。
- `src/styles.css`：只新增工艺组件样式。

### Task 1: 工艺状态模型和默认值

**Files:** Create `src/finish/finishTypes.ts`; modify `src/app/types.ts`, `src/app/projectReducer.ts`; test `src/finish/finishTypes.test.ts`, `src/app/projectReducer.test.ts`。

- [ ] 写失败测试，断言初始项目包含五种工艺、六个空蒙版和默认变换 `{ scale: 100, offsetX: 0, offsetY: 0, rotation: 0 }`。
- [ ] 运行 `npm test -- src/finish/finishTypes.test.ts src/app/projectReducer.test.ts`，预期因 `boxFinish` 不存在而失败。
- [ ] 定义 `FinishKind`、`FinishMaskAsset`、`FinishLayerState`、`BoxFinishState` 和 `createDefaultBoxFinish()`；把 `ProjectState.version` 升级并加入 `boxFinish`。
- [ ] 为选择工艺、开关、参数更新、蒙版设置/删除/清空、变换更新/重置增加 reducer actions；对缩放 50–300、偏移 -100–100、旋转 -180–180 和有限数值做拒绝式校验。
- [ ] 重跑测试，预期通过。

### Task 2: 项目文件兼容

**Files:** Modify `src/project/codec.ts`; test `src/project/codec.test.ts`。

- [ ] 写失败测试：旧版本文档解码后补默认 `boxFinish`；新版本保存再打开后保留蒙版变换和参数。
- [ ] 运行 `npm test -- src/project/codec.test.ts`，预期版本或字段校验失败。
- [ ] 更新 codec，旧版本迁移时只补工艺默认值，不改变 box、pouch、innerPackaging1、faces 和 camera。
- [ ] 重跑 codec 测试，预期通过。

### Task 3: 工艺蒙版上传与变换 UI

**Files:** Create `src/finish/FinishFaceGrid.tsx`, `src/finish/FinishPanel.tsx`; test `src/finish/FinishFaceGrid.test.tsx`, `src/finish/FinishPanel.test.tsx`。

- [ ] 写失败交互测试：五张工艺卡、当前层开关、六面上传、参数滑块、选中面后四项变换和重置均可访问。
- [ ] 运行对应测试，预期组件不存在而失败。
- [ ] 复用现有 `validateImage` 和 `readImageDataUrl` 的输入规则；六面顺序固定为 `top / left / front / right / back / bottom`。
- [ ] 实现数值输入与滑块同步；变换范围为缩放 50–300、偏移 -100–100、旋转 -180–180。
- [ ] 重跑组件测试，预期通过。

### Task 4: App 状态接线和回归边界

**Files:** Modify `src/app/App.tsx`; test `src/app/App.test.tsx`。

- [ ] 写失败测试：`box` 的工艺标签显示完整面板；切换为 `pouch` 或 `inner-packaging-1` 后显示“不适用于当前包装”且不出现蒙版上传。
- [ ] 写失败测试：上传失败只显示对应工艺面的错误，已有蒙版不被覆盖。
- [ ] 实现工艺上传、删除、清空、参数和变换的 history commit 接线。
- [ ] 重跑 App 测试，预期通过且现有贴图/盒型/相机断言不变。

### Task 5: 蒙版纹理矩阵

**Files:** Create `src/finish/finishTexture.ts`; test `src/finish/finishTexture.test.ts`。

- [ ] 写失败测试：100%/0/0/0 为恒等变换；缩放、偏移、旋转以中心为基准；纹理使用 clamp 而非 repeat。
- [ ] 实现 `configureFinishMaskTexture(texture, transform)`，设置 `wrapS/wrapT = ClampToEdgeWrapping`、`matrixAutoUpdate = false` 并计算中心化 UV 矩阵。
- [ ] 重跑纹理测试，预期通过。

### Task 6: 六面实时工艺覆盖

**Files:** Create `src/finish/FinishOverlay.tsx`; modify `src/scene/PrintedBox.tsx`; test `src/finish/FinishOverlay.test.tsx`, `src/scene/faceMaterials.test.ts`。

- [ ] 写失败测试：只有已启用且有蒙版的面创建覆盖层；蒙版与盒面映射顺序一致。
- [ ] 实现每面覆盖层，沿面法线极小偏移，使用蒙版 alpha；烫金/银使用金属材质，镭射使用物理材质虹彩，UV 使用 clearcoat，击凸/压凹使用 bump/normal 近似。
- [ ] 确保空蒙版层不创建 mesh 或 material，降低 draw call。
- [ ] 重跑材质测试，预期通过。

### Task 7: 样式和响应式

**Files:** Modify `src/styles.css`; test `src/app/App.test.tsx`。

- [ ] 新增只以 `.finish-*` 为前缀的样式，复刻参考站的双列工艺卡、参数卡、开关和六面上传密度。
- [ ] 在窄屏把工艺卡和变换控件改为单列，确保数值和单位不截断。
- [ ] 运行 App 测试，预期无可访问名称或结构回归。

### Task 8: 全量验证与真实浏览器验收

**Files:** Modify tests only when发现真实缺陷对应的回归用例。

- [ ] 运行 `npm run typecheck`，预期 0 errors。
- [ ] 运行 `npm run lint`，预期 0 errors。
- [ ] 运行 `npm test`，预期全部通过。
- [ ] 运行 `npm run build`，确认生成 `dist/client/index.html`、`dist/server/index.js`、`dist/.openai/hosting.json`。
- [ ] 运行 `npm run test:sites`，预期全部通过。
- [ ] 启动本地 Vite，用桌面和 390×844 浏览器真实上传代表性印刷图与黑白蒙版，验证缩放、旋转、位置、多层开关和透明 PNG 导出可见。
- [ ] 回归检查自立袋和内包装1的贴图、尺寸、旋转及保存打开行为未改变。

## 自检结论

- 规格中的五种工艺、六面蒙版、独立变换、多层叠加、项目兼容、导出和移动端验收均有对应任务。
- 计划没有待定项；命名统一使用 `boxFinish`、`FinishKind` 和 `FinishMaskAsset`。
- 当前目录不是 Git 仓库，因此不包含不可执行的 commit 步骤；文件级变更和验证仍保持独立检查点。
