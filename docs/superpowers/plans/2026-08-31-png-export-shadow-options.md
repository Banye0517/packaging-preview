# PNG 导出规格与投影选项 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 恢复包装模型接触投影，并提供 800×800 / 3000×3000、各带或不带投影的四种透明 PNG 导出。

**Architecture:** 预览中的 `ContactShadows` 放入具名 Three.js group；导出器按显式预设临时切换该 group 的可见性并恢复。工具栏负责呈现并传递四个固定导出预设，应用层负责文件命名。

**Tech Stack:** React 19、TypeScript、React Three Fiber、Three.js、Vitest。

---

### Task 1: 可配置透明 PNG 导出

**Files:**
- Modify: `src/export/transparentPng.ts`
- Test: `src/export/transparentPng.test.ts`

- [ ] 写失败测试：800 与 3000 预设分别设置对应方形尺寸；无投影导出临时隐藏 shadow group，且 finally 恢复可见性。
- [ ] 运行 `npm test -- --run src/export/transparentPng.test.ts`，确认旧的固定 2000×2000 实现失败。
- [ ] 以 `size`、`includeShadow` 与 shadow group 为唯一新增参数，实现并用 `try/finally` 恢复全部状态。
- [ ] 重跑同一测试，确认通过。

### Task 2: 场景接触投影与导出桥接

**Files:**
- Modify: `src/scene/BoxScene.tsx`
- Test: `src/scene/BoxScene.test.tsx`

- [ ] 写失败测试：场景包含产品接触投影，且导出调用可接收一个预设。
- [ ] 运行 `npm test -- --run src/scene/BoxScene.test.tsx`，确认失败。
- [ ] 恢复 `ContactShadows`，放入具名 group；扩展场景 ref 的导出方法并把 group 传给导出器。
- [ ] 重跑同一测试，确认通过。

### Task 3: 四项导出菜单

**Files:**
- Modify: `src/shell/ProjectToolbar.tsx`
- Modify: `src/shell/ProjectToolbar.test.tsx`
- Modify: `src/app/App.tsx`
- Test: `src/app/App.test.tsx`

- [ ] 写失败测试：点击“导出”后可见四个精确标签，点击其中一项会携带对应尺寸和投影布尔值。
- [ ] 运行 `npm test -- --run src/shell/ProjectToolbar.test.tsx src/app/App.test.tsx`，确认失败。
- [ ] 添加固定导出预设与菜单；应用层调用对应导出并用“普通/高清、尺寸、带/无投影”命名文件。
- [ ] 重跑相关测试，确认通过。

### Task 4: 端到端验证

**Files:**
- Verify only: `src/`

- [ ] 运行 `npm run typecheck && npm run lint && npm test -- --run && npm run build && npm run test:sites && git diff --check`。
- [ ] 在真实浏览器分别点击四个菜单项，核对菜单、预览接触投影、800×800 与 3000×3000 渲染路径及无投影状态。
