# GitHub 大版本首页与截图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用真实本地预览截图更新包装预览 GitHub 首页，完整说明本次多包装组合与展台大版本，并验证远端 `main`。

**Architecture:** 截图从当前 Vite 应用生成并保存为仓库内的压缩 WebP，README 以主视觉、三张功能图和功能章节组成产品叙事。发布只推送 `github` 远端的 `main`，不改动内部 `origin`。

**Tech Stack:** Vite、React、Three.js、浏览器截图、PNG/WebP 转换、Markdown、Git/GitHub CLI。

---

### Task 1: 准备截图工作区与真实场景

**Files:**
- Create: `docs/images/` 下四张最终图片
- Modify: 无

- [ ] **Step 1: 检查本地预览和素材路径**

确认 `http://localhost:60401/` 可访问，确认截图不包含用户隐私或未授权外部素材；优先使用项目现有图稿或自制纯色图稿。

- [ ] **Step 2: 在浏览器创建主视觉状态**

添加 4–6 个包装实例，选择方案 C/D 中最能显示前后层级的排列，启用暖白或浅灰一体阶梯展台，切换到 16:9，调整相机使包装与展台完整入画。

- [ ] **Step 3: 截取并检查主视觉**

截取真实 16:9 预览，检查无模型悬空、穿插、明显空白模型和控件遮挡；保存为 `docs/images/01-composition-hero.webp`。

- [ ] **Step 4: 创建并截取三个功能状态**

分别准备并保存：

```text
docs/images/02-multi-package-pedestal.webp   # 实例列表、A/B/C/D、展台和颜色/圆角
docs/images/03-artwork-dimensions.webp       # 单实例贴图与盒型尺寸设置
docs/images/04-export-frame.webp             # 1:1/16:9/9:16、框外工具栏和白框
```

每张图只承担一个主题，使用浏览器实际画面而非手工合成 UI。

- [ ] **Step 5: 压缩与尺寸检查**

将四张图片转换为适合 README 的 WebP，单张控制在 2 MB 内；确认 `file` 能识别图片，确认宽高与主题一致。

- [ ] **Step 6: Commit**

```bash
git add docs/images/01-composition-hero.webp docs/images/02-multi-package-pedestal.webp docs/images/03-artwork-dimensions.webp docs/images/04-export-frame.webp
git commit -m "docs: add major release screenshots"
```

### Task 2: 更新 GitHub README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 写入主视觉与大版本摘要**

在标题后加入在线演示入口、主视觉图和一句明确定位；新增“本次大版本更新”章节，准确写出 1–6 个实例、混合盒型、四种排列、真实尺寸避碰、落地居中、展台圆角和 2K 三比例导出。

- [ ] **Step 2: 加入三张功能图和说明**

使用相对路径插入 `docs/images/02...` 至 `04...`，每张图下方只写对应能力与用户收益，不重复堆叠实现细节。

- [ ] **Step 3: 校正现有功能清单**

保留七种包装类型、六面上传、工艺、相机、项目保存/加载、透明 PNG、本地处理说明；补充当前已实现的多实例和展台限制，删除过时或未实现的描述。

- [ ] **Step 4: 本地检查 Markdown 引用**

运行：

```bash
rg -n "docs/images/|在线预览|本次大版本更新|1–6|A/B/C/D" README.md
git diff --check
```

确认四张图片路径存在且无死链接。

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: document major packaging composition release"
```

### Task 3: 发布前验证与推送 GitHub

**Files:**
- Modify: 无

- [ ] **Step 1: 运行项目门禁**

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
npm run test:sites
```

所有命令必须成功；构建必须生成 `dist/client/index.html`、`dist/server/index.js` 和 `dist/.openai/hosting.json`。

- [ ] **Step 2: 检查提交和远端分支**

```bash
git status --short
git log -3 --oneline
git remote get-url github
```

确认只包含本次 README、截图和文档提交；无关 `.superpowers/` 与旧文档保持未跟踪。

- [ ] **Step 3: 推送 GitHub**

```bash
git push github main
```

只向 `github` 远端推送，不推送 `origin`。

- [ ] **Step 4: 核对远端精确提交**

```bash
git rev-parse HEAD
git ls-remote github refs/heads/main
```

两者的 SHA 必须完全一致；网络失败时保留本地提交，不宣称已发布。

- [ ] **Step 5: 浏览器确认 GitHub 首页**

在独立浏览器标签页打开仓库首页，确认 README 标题、主视觉和三张功能图真实加载；不改变当前本地预览标签页。

### Task 4: 最终报告

- [ ] **Step 1: 汇总版本提交、远端 SHA、截图路径和验证结果**

- [ ] **Step 2: 说明 GitHub 页面和本地预览地址**

- [ ] **Step 3: 说明未更新 `MEMORY.md`，并列出仍保留的无关未跟踪文件**
