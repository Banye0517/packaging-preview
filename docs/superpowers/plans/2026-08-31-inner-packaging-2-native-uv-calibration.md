# Inner Packaging 2 Native UV Calibration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make inner packaging 2 artwork fit the authored front/back UV islands by default while keeping six optional per-face adjustment controls.

**Architecture:** Extract front/back UV regions once from the loaded glTF geometry, then draw each uploaded image into its real UV bounds instead of fixed atlas halves. Extend the existing transform state with independent horizontal and vertical stretch, migrate version 10 projects to version 11, and keep the controls inside a collapsed native disclosure.

**Tech Stack:** React 19, TypeScript 6, Three.js, Canvas 2D, Vitest, Testing Library

---

### Task 1: Extend and migrate the artwork transform contract

**Files:**
- Modify: `src/app/types.ts`
- Modify: `src/app/projectReducer.ts`
- Modify: `src/project/codec.ts`
- Test: `src/app/projectReducer.test.ts`
- Test: `src/project/codec.test.ts`

- [ ] **Step 1: Write failing state and migration tests**

Assert both default face transforms and reset results equal:

```ts
{
  scale: 100,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  stretchX: 100,
  stretchY: 100,
}
```

Add reducer checks accepting `stretchX: 50` and rejecting `stretchY: 301`. Add a codec fixture with `version: 10` and four-field transforms; decoding must return version 11 with both stretch fields set to 100.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm run test:run -- src/app/projectReducer.test.ts src/project/codec.test.ts`

Expected: FAIL because `ArtworkTransform` has no stretch fields and version 10 is still current.

- [ ] **Step 3: Implement the state and codec changes**

Add these fields:

```ts
export interface ArtworkTransform {
  scale: number
  offsetX: number
  offsetY: number
  rotation: number
  stretchX: number
  stretchY: number
}
```

Set `ProjectState.version` and new projects to 11. Treat `scale`, `stretchX`, and `stretchY` as 50–300 controls in the reducer. Preserve a `Version10ProjectState` validator for the old four-field shape, migrate it by adding `stretchX: 100` and `stretchY: 100` to both faces, and validate all six fields for version 11.

- [ ] **Step 4: Run focused tests and verify pass**

Run: `npm run test:run -- src/app/projectReducer.test.ts src/project/codec.test.ts`

Expected: both files PASS.

- [ ] **Step 5: Commit the state migration**

```bash
git add src/app/types.ts src/app/projectReducer.ts src/project/codec.ts src/app/projectReducer.test.ts src/project/codec.test.ts
git commit -m "feat: extend inner packaging artwork transforms"
```

### Task 2: Extract real UV regions and calibrate atlas drawing

**Files:**
- Modify: `src/innerPackaging/innerPackaging2Texture.ts`
- Modify: `src/innerPackaging/PrintedInnerPackaging2.tsx`
- Test: `src/innerPackaging/innerPackaging2Texture.test.ts`
- Test: `src/innerPackaging/PrintedInnerPackaging2.test.ts`

- [ ] **Step 1: Write failing UV extraction tests**

Create a small indexed `BufferGeometry` with front-facing triangles using U coordinates below 0.5 and back-facing triangles above 0.5. Assert:

```ts
expect(extractInnerPackaging2UvRegions(geometry)).toEqual({
  front: { minU: 0.08, maxU: 0.44, minV: 0.1, maxV: 0.9 },
  back: { minU: 0.56, maxU: 0.94, minV: 0.12, maxV: 0.88 },
})
```

Update atlas tests so `drawInnerPackaging2Atlas` receives these regions, clips to their pixel bounds, applies no unconditional `Math.PI`, and multiplies fitted width and height by `stretchX / 100` and `stretchY / 100`.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm run test:run -- src/innerPackaging/innerPackaging2Texture.test.ts src/innerPackaging/PrintedInnerPackaging2.test.ts`

Expected: FAIL because UV extraction and region-driven drawing do not exist.

- [ ] **Step 3: Implement geometry-driven UV regions**

Export these contracts from `innerPackaging2Texture.ts`:

```ts
export interface UvRegion {
  minU: number
  maxU: number
  minV: number
  maxV: number
}

export interface InnerPackaging2UvRegions {
  front: UvRegion
  back: UvRegion
}

export function extractInnerPackaging2UvRegions(
  geometry: BufferGeometry,
): InnerPackaging2UvRegions
```

For each indexed triangle, average its vertex normals to determine whether it belongs to the model front or back, then expand only that face's UV bounds. Validate that both regions have positive width and height and remain in 0–1.

Change atlas drawing to convert each UV region to canvas pixels, clip to that rectangle, aspect-fit the image inside the region, apply user scale and stretch, then apply offsets and rotation. Remove the unconditional `Math.PI`; represent any required model orientation as an explicit per-face fixed calibration constant proven by the real browser test.

- [ ] **Step 4: Pass extracted regions into the material**

Compute the regions from `sourceGeometry` with `useMemo`, pass them into `InnerPackaging2Material`, and include them in the texture memo dependencies:

```tsx
const uvRegions = useMemo(
  () => extractInnerPackaging2UvRegions(sourceGeometry),
  [sourceGeometry],
)

<InnerPackaging2Material value={value} uvRegions={uvRegions} />
```

- [ ] **Step 5: Run focused tests and verify pass**

Run: `npm run test:run -- src/innerPackaging/innerPackaging2Texture.test.ts src/innerPackaging/PrintedInnerPackaging2.test.ts`

Expected: both files PASS.

- [ ] **Step 6: Commit UV calibration**

```bash
git add src/innerPackaging/innerPackaging2Texture.ts src/innerPackaging/PrintedInnerPackaging2.tsx src/innerPackaging/innerPackaging2Texture.test.ts src/innerPackaging/PrintedInnerPackaging2.test.ts
git commit -m "fix: calibrate inner packaging artwork to native uv"
```

### Task 3: Make transforms optional advanced controls

**Files:**
- Modify: `src/innerPackaging/InnerPackaging2ArtworkUploader.tsx`
- Test: `src/innerPackaging/InnerPackaging2ArtworkUploader.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing interaction tests**

Assert “高级调整” is visible, the six sliders are absent before expansion, and after clicking the summary the following controls appear:

```ts
[
  '贴图缩放',
  '水平位置',
  '垂直位置',
  '贴图旋转',
  '水平拉伸',
  '垂直拉伸',
]
```

Change horizontal stretch to 125 and assert `onTransformChange('front', 'stretchX', 125)`.

- [ ] **Step 2: Run the component test and verify failure**

Run: `npm run test:run -- src/innerPackaging/InnerPackaging2ArtworkUploader.test.tsx`

Expected: FAIL because controls are always open and stretch controls are missing.

- [ ] **Step 3: Implement the collapsed advanced controls**

Wrap the existing section content in a native disclosure:

```tsx
<details className="texture-transform-disclosure">
  <summary>高级调整</summary>
  <section className="texture-transform-controls" aria-label={`${label}贴图变换`}>
    {/* six controls and reset button */}
  </section>
</details>
```

Append `stretchX` and `stretchY` controls with 50–300 ranges. Style the summary as a compact secondary control without changing the upload cards or other packaging panels.

- [ ] **Step 4: Run the component test and verify pass**

Run: `npm run test:run -- src/innerPackaging/InnerPackaging2ArtworkUploader.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the optional controls**

```bash
git add src/innerPackaging/InnerPackaging2ArtworkUploader.tsx src/innerPackaging/InnerPackaging2ArtworkUploader.test.tsx src/styles.css
git commit -m "feat: add optional inner packaging artwork adjustments"
```

### Task 4: Regression and real-browser acceptance

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Run automated verification**

Run:

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
npm run test:sites
```

Expected: all commands exit 0; build leaves `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

- [ ] **Step 2: Verify in the existing browser preview**

Select 内包装2, upload a front image containing upright text and a different back image, and inspect both sides by rotating the model. Confirm default upload is centered, upright, confined to the correct face, and requires no adjustment. Expand 高级调整 and verify scale, offsets, rotation, horizontal stretch, vertical stretch, and reset on each face independently.

- [ ] **Step 3: Record the durable mapping rule**

Update the inner-packaging-2 section of `AGENTS.md` to state that default uploads are calibrated from real UV regions, advanced controls are collapsed by default, and both stretch controls are supported.

- [ ] **Step 4: Commit verification documentation**

```bash
git add AGENTS.md
git commit -m "docs: record native uv artwork behavior"
```
