# Hanging Tissue Color and Body Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore balanced artwork color and independently resize only the hanging-tissue printable body width, height, and depth while preserving the handle and pulled-sheet shape.

**Architecture:** Add `depth` to the versioned hanging-tissue state, then isolate geometry deformation in a pure helper that always clones original geometry. Derive the printable body interval from the already-classified face triangles, apply continuous body deformation inside that interval, translate the unchanged handle above it, and keep the independent pulled-sheet geometry unscaled. Configure only artwork materials for balanced color.

**Tech Stack:** React 19, TypeScript, Three.js, React Three Fiber, Vitest, Vite.

---

### Task 1: Add versioned depth state

**Files:**
- Modify: `src/app/types.ts`
- Modify: `src/app/projectReducer.ts`
- Modify: `src/app/projectReducer.test.ts`
- Modify: `src/project/codec.ts`
- Modify: `src/project/codec.test.ts`

- [ ] **Step 1: Write failing state and migration tests**

Add expectations that the current state is version 13, default hanging tissue includes `depth: 80`, the reducer accepts finite `width | height | depth` values in the existing 30–1000 range, and rejects `NaN` or out-of-range values. Add a version-12 fixture without `depth` and expect decode to migrate it to version 13 with `depth: 80` while preserving all other hanging-tissue fields.

```ts
expect(createInitialProject().hangingTissue).toMatchObject({
  width: 160,
  height: 205,
  depth: 80,
})

const resized = projectReducer(initial, {
  type: 'hanging-tissue/set', key: 'depth', value: 96,
})
expect(resized.hangingTissue.depth).toBe(96)
expect(projectReducer(resized, {
  type: 'hanging-tissue/set', key: 'depth', value: Number.NaN,
})).toBe(resized)
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:run -- src/app/projectReducer.test.ts src/project/codec.test.ts`

Expected: FAIL because `depth` and version 13 are not defined.

- [ ] **Step 3: Implement state and migration**

Change `ProjectState.version` to `13`, extend `HangingTissueState`, accept all three dimensions in the action, and centralize range validation in the reducer.

```ts
export interface HangingTissueState {
  // existing fields
  width: number
  height: number
  depth: number
}

case 'hanging-tissue/set':
  if (!Number.isFinite(action.value) || action.value < 30 || action.value > 1000) return state
  return { ...state, hangingTissue: { ...state.hangingTissue, [action.key]: action.value } }
```

Add a `Version12ProjectState` validator using the existing version-12 rules, then migrate with `{ ...value, version: 13, hangingTissue: { ...value.hangingTissue, depth: 80 } }`. Require finite positive `depth` in version 13 validation. Update older migrations to emit version 13.

- [ ] **Step 4: Run focused tests**

Run: `npm run test:run -- src/app/projectReducer.test.ts src/project/codec.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/types.ts src/app/projectReducer.ts src/app/projectReducer.test.ts src/project/codec.ts src/project/codec.test.ts
git commit -m "feat: add hanging tissue depth state"
```

### Task 2: Implement continuous body-only deformation

**Files:**
- Create: `src/hangingTissue/hangingTissueDeformation.ts`
- Create: `src/hangingTissue/hangingTissueDeformation.test.ts`
- Modify: `src/hangingTissue/PrintedHangingTissue.tsx`

- [ ] **Step 1: Write failing pure-geometry tests**

Build a small indexed fixture containing a bottom anchor, printable body, connector, and top handle. Assert that body bounds change to the requested ratios, bottom vertices remain fixed, handle width/depth and height remain unchanged, handle Y translates by the body height delta, and source geometry positions are not mutated.

```ts
const result = deformHangingTissueGeometry(source, {
  bodyMinY: 1,
  bodyMaxY: 3,
  widthScale: 1.5,
  heightScale: 0.75,
  depthScale: 0.6,
})

expect(boundsOfTaggedVertices(result, 'body').size.x).toBeCloseTo(3)
expect(boundsOfTaggedVertices(result, 'handle').size.x).toBeCloseTo(1)
expect(boundsOfTaggedVertices(result, 'handle').size.y).toBeCloseTo(1)
expect(source.getAttribute('position').getY(0)).toBe(0)
```

- [ ] **Step 2: Run the deformation test and verify failure**

Run: `npm run test:run -- src/hangingTissue/hangingTissueDeformation.test.ts`

Expected: FAIL because the deformation helper does not exist.

- [ ] **Step 3: Implement the deformation helper**

Expose a pure function that clones the geometry, maps Y continuously, uses full X/Z scale through the printable band, tapers X/Z scale across the connector band, translates unchanged handle vertices, and recomputes normals and bounds.

```ts
export interface HangingTissueDeformation {
  bodyMinY: number
  bodyMaxY: number
  connectorMaxY: number
  widthScale: number
  heightScale: number
  depthScale: number
}

export function deformHangingTissueGeometry(
  source: BufferGeometry,
  options: HangingTissueDeformation,
) {
  const result = source.clone()
  const positions = result.getAttribute('position') as BufferAttribute
  const heightDelta = (options.bodyMaxY - options.bodyMinY) * (options.heightScale - 1)
  for (let index = 0; index < positions.count; index += 1) {
    const y = positions.getY(index)
    const connectorWeight = y <= options.bodyMaxY ? 1 :
      y >= options.connectorMaxY ? 0 :
      1 - (y - options.bodyMaxY) / (options.connectorMaxY - options.bodyMaxY)
    const xScale = 1 + (options.widthScale - 1) * connectorWeight
    const zScale = 1 + (options.depthScale - 1) * connectorWeight
    positions.setX(index, positions.getX(index) * xScale)
    positions.setZ(index, positions.getZ(index) * zScale)
    positions.setY(index, mapBodyAndTranslateTop(y, options, heightDelta))
  }
  positions.needsUpdate = true
  result.computeVertexNormals()
  result.computeBoundingBox()
  result.computeBoundingSphere()
  return result
}
```

`bodyMinY` and `bodyMaxY` come from the union of the four already-classified printable face geometries. `connectorMaxY` is the first stable horizontal gap or narrow connector transition above `bodyMaxY`, calculated once from the source geometry rather than as a percentage of UI height.

- [ ] **Step 4: Integrate without scaling the pulled sheet**

In `PrintedHangingTissue`, generate deformed face and remainder geometries from originals with memoization. Replace whole-group dimension scale with one native base scale. Set the independent `纸.1` object to its original scale and translate only its center offset needed to remain aligned with the deformed bottom outlet.

```tsx
const dimensionScale = {
  widthScale: value.width / 160,
  heightScale: value.height / 205,
  depthScale: value.depth / 80,
}

<group scale={baseScale}>
  <primitive object={model} position={placement.modelOffset} />
</group>
```

- [ ] **Step 5: Run hanging-tissue geometry tests**

Run: `npm run test:run -- src/hangingTissue`

Expected: PASS, including exterior face, UV, grounding, structure preservation, and deformation tests.

- [ ] **Step 6: Commit**

```bash
git add src/hangingTissue/hangingTissueDeformation.ts src/hangingTissue/hangingTissueDeformation.test.ts src/hangingTissue/PrintedHangingTissue.tsx
git commit -m "feat: resize hanging tissue body independently"
```

### Task 3: Restore balanced artwork color

**Files:**
- Modify: `src/hangingTissue/hangingTissueModel.ts`
- Modify: `src/hangingTissue/PrintedHangingTissue.tsx`
- Modify: `src/hangingTissue/PrintedHangingTissue.test.ts`

- [ ] **Step 1: Write the failing material-policy test**

Define and test one explicit artwork material configuration so the policy cannot silently regress.

```ts
expect(HANGING_TISSUE_ARTWORK_MATERIAL).toEqual({
  color: '#ffffff',
  roughness: 0.48,
  metalness: 0.01,
  toneMapped: false,
  side: BackSide,
})
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm run test:run -- src/hangingTissue/PrintedHangingTissue.test.ts`

Expected: FAIL because the artwork material policy is not defined and the current base color is `#f8fafc`.

- [ ] **Step 3: Apply the balanced material policy**

Export the typed constant from `hangingTissueModel.ts` and spread it only into the four artwork materials. Keep `texture.colorSpace = SRGBColorSpace`; do not change white structure or pulled-sheet materials.

```ts
export const HANGING_TISSUE_ARTWORK_MATERIAL = {
  color: '#ffffff',
  roughness: 0.48,
  metalness: 0.01,
  toneMapped: false,
  side: BackSide,
} as const
```

- [ ] **Step 4: Run the focused test**

Run: `npm run test:run -- src/hangingTissue/PrintedHangingTissue.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hangingTissue/hangingTissueModel.ts src/hangingTissue/PrintedHangingTissue.tsx src/hangingTissue/PrintedHangingTissue.test.ts
git commit -m "fix: preserve hanging tissue artwork color"
```

### Task 4: Expose the three body dimensions and run lightweight acceptance

**Files:**
- Modify: `src/hangingTissue/HangingTissuePanel.tsx`
- Modify: `src/hangingTissue/PrintedHangingTissue.test.ts`
- Modify: `AGENTS.md`
- Modify: `Tech-Spec.md`

- [ ] **Step 1: Write the failing panel contract test**

Add a focused render test asserting labels and emitted keys for all three fields.

```ts
expect(screen.getByLabelText('盒身宽度（毫米）')).toHaveValue(160)
expect(screen.getByLabelText('盒身高度（毫米）')).toHaveValue(205)
expect(screen.getByLabelText('盒身厚度（毫米）')).toHaveValue(80)
fireEvent.change(screen.getByLabelText('盒身厚度（毫米）'), { target: { value: '96' } })
expect(onChange).toHaveBeenCalledWith('depth', 96)
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm run test:run -- src/hangingTissue`

Expected: FAIL because the depth field and updated labels are absent.

- [ ] **Step 3: Update the panel and durable documentation**

Change the panel callback to `key: 'width' | 'height' | 'depth'`, render the three confirmed labels, and describe that only the printable body changes while the handle and pulled sheet keep their shape. Record the same durable behavior in `AGENTS.md` and technical boundaries in `Tech-Spec.md`.

- [ ] **Step 4: Run scoped and project checks**

Run:

```bash
npm run test:run -- src/hangingTissue src/app/projectReducer.test.ts src/project/codec.test.ts
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: all commands PASS; build may retain the existing non-blocking chunk-size warning.

- [ ] **Step 5: Perform one representative browser check**

Use one high-saturation sRGB image. Verify front and side artwork no longer look globally gray, width/height/depth each affect the intended printable dimension, handle and pulled sheet retain their shape, and the model remains grounded. Check one wide and one narrow body state only; do not expand into full-site QA.

- [ ] **Step 6: Commit**

```bash
git add src/hangingTissue/HangingTissuePanel.tsx src/hangingTissue/PrintedHangingTissue.test.ts AGENTS.md Tech-Spec.md
git commit -m "feat: expose hanging tissue body dimensions"
```
