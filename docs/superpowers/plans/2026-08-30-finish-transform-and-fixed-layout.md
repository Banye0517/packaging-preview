# 金属工艺与固定预览 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增强金银光泽，将工艺材质纹理与蒙版变换解耦，并在桌面端固定左侧 3D 区域。

**Architecture:** alphaMap 单独使用用户 transform；金银和镭射的材质纹理使用固定 UV DataTexture。布局通过桌面 CSS 高度链和右侧 overflow 实现，移动端显式恢复文档滚动。

**Tech Stack:** React, React Three Fiber, Three.js, CSS, Vitest

---

### Task 1: 静态金银膜

**Files:** `src/finish/finishTexture.ts`, `src/finish/finishMaterial.ts`, `src/finish/FinishOverlay.tsx`, `src/finish/FinishOverlay.test.ts`

- [ ] 增加失败测试，要求金银材质的 metalness、envMapIntensity、clearcoat 和静态膜纹理满足设计合同。
- [ ] 运行定向测试确认失败。
- [ ] 实现金银 DataTexture 并接入覆盖材质。
- [ ] 运行定向测试确认通过。

### Task 2: 解耦蒙版与材质纹理

**Files:** `src/finish/finishTexture.ts`, `src/finish/FinishOverlay.tsx`, `src/finish/finishTexture.test.ts`

- [ ] 增加失败测试，验证材质纹理始终是单位 transform，蒙版继续等比变换。
- [ ] 运行定向测试确认失败。
- [ ] 将镭射与金银膜的创建从用户 transform 改为固定 transform。
- [ ] 运行定向测试确认通过。

### Task 3: 桌面右侧独立滚动

**Files:** `src/styles.css`, `src/styles.test.ts`

- [ ] 增加失败 CSS 合同测试，验证桌面页面不滚动、右侧可滚动、移动端恢复滚动。
- [ ] 运行定向测试确认失败。
- [ ] 实现桌面高度链、预览固定和右侧 overflow。
- [ ] 运行全量测试、构建和桌面/移动浏览器验收。
