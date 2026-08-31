# 镭射效果保真修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让六面盒镭射蒙版呈现与参考站一致的不透明柔和彩虹金属膜。

**Architecture:** 蒙版载入时将非白色图像转成带抗锯齿边界的二值覆盖率，阻止灰度细节变成透明度。镭射材质使用独立 CanvasTexture 彩虹膜作为基色，再叠加 MeshPhysicalMaterial 的金属与虹彩反射。

**Tech Stack:** React, React Three Fiber, Three.js, Vitest

---

### Task 1: 修正蒙版覆盖率

**Files:** `src/finish/finishTexture.ts`, `src/finish/finishTexture.test.ts`

- [ ] 先增加失败测试：黑、中灰和深灰都生成不透明工艺区，纯白与透明像素不生成工艺。
- [ ] 运行 `npm run test:run -- src/finish/finishTexture.test.ts` 确认因为尚未二值化而失败。
- [ ] 实现白色截止与窄边界平滑区，将结果写入 alphaMap 使用的绿色通道。
- [ ] 重跑定向测试并确认通过。

### Task 2: 构建参考图彩虹膜

**Files:** `src/finish/finishTexture.ts`, `src/finish/FinishOverlay.tsx`, `src/finish/finishMaterial.ts`, `src/finish/FinishOverlay.test.ts`

- [ ] 先增加失败测试：镭射材质不使用原包装贴图，并提供紫、蓝、青、绿彩虹膜色站。
- [ ] 运行定向测试并确认失败。
- [ ] 生成可复用彩虹膜 CanvasTexture，只在 `holographic` 材质中加载、绑定和释放。
- [ ] 保留现有粗糙度、虹彩强度、凹凸强度及蒙版变换。

### Task 3: 真实浏览器视觉验收

**Files:** `design-qa.md`

- [ ] 运行类型检查、lint、全量测试、生产构建和 Sites 测试。
- [ ] 复用当前本地预览，上传同一包装贴图与镭射蒙版，截取同角度画面。
- [ ] 将参考图与实现截图并排比较，确认内部无原图透出、彩虹过渡可见、边界清晰且区域外不变。
- [ ] `design-qa.md` 只有视觉对比通过后才写入 `final result: passed`。
