# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Approved Product Scope

- Keep exactly four settings areas: 贴图、工艺、盒型、相机。
- Do not add a 场景 or AI area.
- Box artwork input remains six explicit face uploads; other packaging types use their explicitly defined upload counts. Do not add dieline splitting or automatic face assignment.

## Durable Packaging Decisions

### Multi-package composition

- Support a composition of one to six independent packaging instances. Different packaging types and repeated instances of the same type may coexist; every instance owns independent artwork, finish, dimensions, and model state.
- Add a `+` action beside every packaging-type choice. A new instance copies that type's dimensions and structural settings but starts with empty artwork and finish masks, then becomes the active instance.
- Keep exactly the existing four settings areas. Users select the active instance either from the 3D preview or from an instance list above those settings; all edits apply only to the active instance.
- One package uses the existing centered single-product preview and does not show layout controls. For two to six packages, keep four selectable presets: A hero-centered, B family row, C staggered cluster, and D two-row grid. Defaults are B for 2, C for 3–4, and D for 5–6; any count from 2–6 may manually use any preset.
- Adding or removing an instance reapplies the count-based recommended preset. Editing dimensions keeps the chosen preset and recomputes spacing, grounding, centering, and camera framing.
- Every layout must preserve each instance's real physical size ratio. Artwork pixel dimensions never resize geometry. Use the transformed world-space bounds to prevent intersection, calculate safe exterior spacing, align every instance's lowest point to one shared ground plane, recenter the complete composition, and frame every package in the camera. No package may float in any preset.
- The first version has no manual position, elevation, or XYZ controls. Preserve an internal path for future manual transforms without exposing it now.
- All instances cast shadows. Preserve existing `receiveShadow={false}` rules for high-density meshes to avoid triangulation artifacts; do not add full global illumination, color bleeding, or dynamic inter-object reflections in the first version.
- The final remaining instance cannot be deleted. At six instances, disable every add action and show the six-package limit. Transparent PNG export and project save/open must include the complete composition and selected layout; legacy projects migrate to a one-instance composition.

- “相机”区域提供全局打光强度 -100%–100%。0% 是标准柔和棚拍光，-100% 保持左上灯位不变并减弱真实光能，100% 增强同一盏左上主光；负值不得反转灯光方向，也不得退化为整张贴图统一压暗。默认和旧项目迁移值均为 0%，透明 PNG 导出必须复用当前强度。
- All ordinary uploaded artwork for every current and future packaging type uses a pure-white `MeshPhysicalMaterial` with its sRGB artwork map, zero metalness, soft roughness, and subtle clearcoat. Product highlights and shadows must come from the model normals and the fixed upper-left studio lights, not from uniform texture brightness multiplication. Every unuploaded printable face, unprinted structure, shadow, and surface-finish material remains physically lit.
- Keep seven independent packaging types: `box`, `pouch`, `inner-packaging-1`, `inner-packaging-2`, `hanging-tissue`, `face-tissue`, and `wet-tissue`.
- “内包装1” uses the supplied glTF main bag mesh and excludes the helper mesh named “大概尺寸”.
- “内包装1”默认绕竖直轴水平旋转 180°，让供稿模型的正面朝向相机。该高密度单网格保留受真实灯光影响和向地面投影，但不接收方向灯阴影贴图，避免贴图后出现与三角剖分一致的自阴影条纹。
- 自立袋、内包装1、内包装2、面纸和悬挂抽纸的高密度网格统一保留物理受光与 `castShadow`，但关闭 `receiveShadow`，防止方向灯阴影贴图产生与三角剖分一致的 self-shadow 纹路。面纸顶部的独立纸巾同样属于高密度网格，必须应用此规则；其他独立结构需按真实网格密度判断。
- “内包装1” has one full-UV artwork upload and width/height controls only. Use the glTF's authored UVs and preserve the model's native depth, bottom, seals, and bulge; do not reuse pouch structure controls.
- “内包装1” full-UV artwork supports 50%–300% scale, horizontal/vertical -100%–100% offsets, and reset. Exposed texture areas are white; never tile or edge-stretch the artwork.
- “内包装1” full-UV artwork also supports -180°–180° rotation and independent 50%–300% horizontal/vertical stretch. Reset restores 0° rotation and 100% stretch.
- “内包装2” uses `public/models/inner-packaging-2.gltf` from the supplied `翅中.gltf` and preserves its single mesh, native shape, depth, rounded corners, bulge, and authored UVs.
- “内包装2” has exactly two artwork uploads. The PSD left UV island is the front and the right UV island is the back. Default uploads must be calibrated from the model's real front/back UV bounds, fill the target region, and apply the model's fixed orientation correction without changing user transform values. Advanced adjustments are collapsed by default; each face independently supports 50%–300% proportional scale, -100%–100% horizontal/vertical offsets, -180°–180° rotation, and 50%–300% horizontal/vertical stretch. Never tile or edge-stretch artwork.
- “内包装2” reuses inner-packaging-1 width, height, and 0°/90°/180° model direction controls. It does not support surface finishes.
- “悬挂抽纸” uses `public/models/hanging-tissue.gltf` from the supplied `悬挂纸巾.gltf`. Render the single printable mesh `悬挂抽纸155` with the independent node `纸.1`, which is the pulled-sheet visibility switch. Never recreate the previous two overlapping printable body meshes.
- The supplied hanging-tissue printable mesh has inward-facing triangle winding and normals. Render only its four artwork geometries with Three.js `BackSide` so artwork appears on the package exterior; keep structural remainder and pulled paper materials unchanged.
- “悬挂抽纸” has exactly four artwork uploads: front, back, left, and right, with no top or bottom upload. The corrected authored UV islands run along U as front, right, back, and left. Label islands by their model-space positions, preserve authored UVs, and never classify them through the asset's inverted normals or rebuild planar UVs. User transforms are independently 50%–300% proportional scale, -100%–100% offsets, -180°–180° rotation, and 50%–300% horizontal/vertical stretch, collapsed by default. Its printable body width, height, and depth are independently editable; deformation applies only to the middle body, while the top handle and independent pulled sheet keep their native shape. It keeps its bottom anchored to the contact ground, retains 0°/90°/180° direction controls, and does not support surface finishes.
- Hanging-tissue artwork is a transparent direct-color overlay on top of an always-present lit base mesh, while retaining its required `BackSide` rendering. Never fill uncovered atlas pixels with white: handles, margins, transparent artwork pixels, and every other uncovered region must reveal the lit base material. Apply the same base color, roughness, and metalness to the independent pulled-paper node so it does not appear darker than the package.
- Each hanging-tissue face stores the body dimensions at upload time. Later width, height, or depth changes must inverse-compensate that face in atlas space so its physical artwork size and aspect remain fixed: larger bodies expose white space and smaller bodies crop; never stretch the artwork with geometry.
- “悬挂抽纸”不提供盒身圆角控制。保留供稿的直角四面结构与独立正、背、左、右印刷面，禁止通过圆角或跨面几何让侧面贴图进入正面。
- “面纸”保留 supplied GLTF 的原始 UV，不替换为独立 RoundedBoxGeometry；盒身圆角默认 0，增加圆角时沿原 UV 将单张完整图稿延伸到圆角表面。图稿上传时记录宽、高、厚度，后续尺寸变化按前后/上下 UV 面反补偿，保持已贴图稿的物理比例并在需要时露出白边或裁切。高级调整中的水平/垂直拉伸以图稿头部为锚点，只向尾部增加或减少覆盖；垂直位置跨过 UV 环向接缝时必须保持同一张图稿首尾连续显示，不得整张消失或在转角断开。
- “湿纸巾”使用 supplied GLTF 内的 `湿巾纸开` / `湿巾纸` 根节点作为开关，不重复加载两个内容相同的资产；只提供纸盒完整 UV 和盖子完整 UV 两张贴图，分别映射 `袋子` 与 `1` 网格。默认打开并显示 `纸.1`，关闭状态自动隐藏纸张；两张贴图独立支持 50%–300% 缩放、-100%–100% 位移、-180°–180° 旋转和 50%–300% 横纵拉伸，高级调整默认收起。尺寸调整记录上传时宽高厚并做贴图反补偿，未上传结构保持受灯光影响。
- “洗脸巾”使用 supplied `洗脸巾1开` 根节点和原始 UV；只提供一张完整主体 UV 图稿映射 `洗脸巾`，`平面` 保持结构材质，`纸` 受顶部纸张开关控制。默认显示纸张；贴图支持同面纸的尺寸记忆/反补偿与旋转、缩放、位移、横纵拉伸，高级调整默认收起。
- The supplied hanging-tissue front and right UV islands overlap by about five pixels in the 2048 atlas. Draw left/right artwork before back/front artwork so the main front/back panels own every overlap; never hide side materials or deform geometry to mask this UV issue.

### Pedestal composition

- Support `none`, steps, islands, and horizontal pedestal presets. Pedestals are real grounded 3D geometry and participate in lighting, shadows, camera framing, and PNG export.
- Keep pedestal controls in the left 3D preview toolbar; do not add a fifth settings area.
- Pedestal colors are user-selectable: warm white, light gray, white, light yellow, and light pink. One composition uses one pedestal color.
- A/B/C/D layouts combine freely with all three pedestal presets. Results must be deterministic; do not use random placement.
- Pedestal width and depth expand from template minimums to fit transformed real-world package bounds. Never shrink packaging to fit a pedestal.
- Every package must be fully supported by the ground or a pedestal top. Packages, pedestal volumes, and other packages must never intersect; pedestal blocks grow upward from the shared ground and never float.
- Preserve the hero package as the highest or primary supported item where the selected layout calls for hierarchy. Recenter and camera-fit the union of packages and pedestals after automatic placement.
- Disabling pedestals restores the existing same-ground A/B/C/D layout. Save pedestal preset and color; legacy projects migrate to no pedestal.
- The first version has no manual pedestal transforms or package XYZ/rotation/scale controls. Preserve a path for later C4D-style manual transforms.

## Box Finish Rules

- Surface finishes apply to all six faces of `box` and only the printable `front`/`back` panels of `pouch`; `inner-packaging-1` and `inner-packaging-2` remain unsupported.
- Support five independently enabled, stackable finish layers: gold foil, silver foil, holographic, spot UV, and emboss/deboss.
- Each finish layer has six explicit face-mask uploads. Do not add dieline splitting, bulk recognition, or automatic face assignment.
- Every uploaded finish mask has independent 50%–300% scale, -100%–100% horizontal/vertical offsets, and -180°–180° rotation. These transforms must be visible on the 3D box and transparent PNG export.
- Finish-mask transforms move only the mask silhouette. Gold, silver, holographic, and other material-film patterns remain anchored to the box face and must not rotate, scale, or translate with the mask.
- Exposed areas outside a transformed mask receive no finish; never tile or edge-stretch finish masks.
- On desktop, lock the 3D preview in the left column and allow scrolling only inside the right settings panel. On mobile, keep the stacked layout and restore normal document scrolling.
- Pouch finish state is independent from box finish state. Never apply pouch finishes to top/side seals, the white structure mesh, or the bottom gusset.

## Stand-up Pouch Rules

- Keep the existing six-face box workflow unchanged; add the stand-up pouch as a separate packaging type.
- The pouch is a three-side-seal stand-up pouch: printable front and back panels, sealed left/right/top edges, and an expanded bottom gusset. Do not create printable side faces or a sealed horizontal bottom edge.
- Pouch artwork uses exactly two uploads: front and back. The bottom gusset is always white; do not add bottom-color or image-sampling controls.
- Pouch thickness is editable in millimeters. The top, left, and right heat seals must use rounded cross-sections that continuously bridge the front and back panels, avoiding a two-sheets-joined appearance.
- The four outer corners share one rounded-corner toggle.
- Closure states are mutually exclusive: none, zipper, or a centered top spout.
- Use `public/models/wing-root-pouch.gltf` (provided as `翅根外包装.gltf`) as the pouch geometry source. It is a single-mesh asset, so classify faces by transformed normals and rebuild planar 0–1 UVs for front/back artwork; keep all remaining model surfaces white.
- Preserve the supplied model's native depth-to-height ratio by scaling depth with height. Never inflate depth from the UI values, interpolate depth by height, or independently squeeze the top relative to the gusset.
