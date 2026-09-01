# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Approved Product Scope

- Keep exactly four settings areas: 贴图、工艺、盒型、相机。
- Do not add a 场景 or AI area.
- Artwork input is six explicit face uploads only; do not add dieline splitting or automatic face assignment.

## Durable Packaging Decisions

- All ordinary uploaded artwork for every current and future packaging type uses direct sRGB color rendering: a pure-white `MeshBasicMaterial` base with `toneMapped={false}`. Artwork color must not be altered by scene lights, environment reflections, exposure, or tone mapping. Apply this only to faces that actually have uploaded artwork; every unuploaded printable face, unprinted structure, shadow, and surface-finish material remains physically lit so the blank model retains its form.
- Keep five independent packaging types: `box`, `pouch`, `inner-packaging-1`, `inner-packaging-2`, and `hanging-tissue`.
- “内包装1” uses the supplied glTF main bag mesh and excludes the helper mesh named “大概尺寸”.
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
- Hanging-tissue body radius defaults to `0 mm` and is capped at half the smaller current width/depth. Follow the six-face box rule that rounding cuts inward while preserving the requested outer width/depth: front/back and side centers stay fixed, and no rounded vertex may protrude beyond the sharp body bounds. It rounds only the middle-body cross-section and fades out through the existing top connector range; never deform the handle or independent pulled sheet, and never alter artwork transforms or artwork-size references.

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
