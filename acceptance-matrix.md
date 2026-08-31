# 验收矩阵

| ID | 要求 | 自动化证据 | 浏览器证据 | 状态 |
| --- | --- | --- | --- | --- |
| UI-01 | 仅贴图、工艺、盒型、相机四标签 | `App.test.tsx` | 桌面与 390×844 实测 | passed |
| UI-02 | 无场景和 AI 入口 | `App.test.tsx` | 标签计数 4，场景计数 0 | passed |
| ART-01 | 六个独立上传入口 | `FaceGrid.test.tsx` | 文件输入计数 6 | passed |
| ART-03 | 自立袋仅正背两个上传入口 | `PouchArtworkGrid.test.tsx`、`App.test.tsx` | 类型切换后文件输入计数 2 | passed |
| ART-04 | 内包装2正背独立上传和等比变换 | `InnerPackaging2ArtworkUploader.test.tsx`、`projectReducer.test.ts` | 正背上传、旋转与缩放实测 | passed |
| ART-02 | 文件类型和空文件校验 | `validateImage.test.ts`、`readImageDataUrl.test.ts` | 代表性 PNG 实传并显示为 3D 纹理 | passed |
| STATE-01 | 单面替换和移除不影响其他面 | `projectReducer.test.ts`、`projectHistory.test.ts` | 撤销移除、重做恢复实测 | passed |
| 3D-01 | 六面材质顺序正确 | `faceMaterials.test.ts` | WebGL 白盒渲染正常 | passed |
| BOX-01 | 真实尺寸保持几何比例 | `projectReducer.test.ts` | 盒型面板与取景实测 | passed |
| BOX-02 | 圆角数值实时改变盒体边角 | `roundedBoxGeometry.test.ts` | 20 mm 圆角实测可见 | passed |
| POUCH-01 | 三边封自立袋无独立侧面或封死底边 | `pouchGeometry.test.ts` | 正视与侧视旋转检查 | passed |
| POUCH-02 | 袋体厚度控制正背片与圆弧封边 | `projectReducer.test.ts`、`pouchGeometry.test.ts` | 厚度输入与侧视检查 | passed |
| POUCH-03 | 白色风琴底、圆角及互斥封口 | `pouchGeometry.test.ts`、`PouchPanel.test.tsx` | 无封口/拉链/居中吸嘴实测 | passed |
| INNER-02 | 翅中模型保留原生UV，左正右背且互不污染 | `innerPackaging2ModelAsset.test.ts`、`innerPackaging2Texture.test.ts` | 高对比正背图旋转检查 | passed |
| FINISH-01 | 六面盒六面与自立袋正背独立支持五种工艺 | `FinishPanel.test.tsx`、`projectReducer.test.ts` | 两种包装切换及上传实测 | passed |
| FINISH-02 | 自立袋工艺仅覆盖正背印刷面 | `PouchFinishOverlay.test.ts` | 正背与侧底旋转检查 | passed |
| FILE-03 | version 1 项目迁移到 version 2 六面盒型 | `codec.test.ts` | 自动化迁移验证 | passed |
| CAM-01 | 拖拽缩放、底面查看与相机按钮 | `cameraLimits.test.ts`、`PreviewControls.test.tsx` | 正视、重置和拖到底面实测 | passed |
| FILE-01 | 新建、打开、保存、导出和帮助有真实处理器 | `ProjectToolbar.test.tsx`、`codec.test.ts` | 帮助、撤销、重做实测；下载由浏览器原生处理 | passed |
| FILE-02 | 导出 2000×2000 透明 PNG | `transparentPng.test.ts` | 内置浏览器不暴露脚本下载事件，以渲染器状态与 Blob 签名测试替代 | passed |
| BUILD-01 | 类型、Lint、测试、构建、Sites | 命令输出 | 不适用 | passed |
