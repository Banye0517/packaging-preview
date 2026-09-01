# Hanging Tissue Rounded Body Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user-controlled millimeter radius to the hanging-tissue middle body without deforming its top handle or independent pulled sheet.

**Architecture:** Persist `hangingTissue.radius` in project state version 15 and expose it beside the existing body dimensions. Extend the current vertex deformation function with a rounded-rectangle cross-section mapping whose vertical weight reuses the existing middle-body mask; both lit base and artwork overlay already share the resulting geometry.

**Tech Stack:** React, TypeScript, Three.js `BufferGeometry`, Vitest, Vite

---

### Task 1: Persist and edit the radius

**Files:**
- Modify: `src/app/types.ts`
- Modify: `src/app/projectReducer.ts`
- Modify: `src/app/projectReducer.test.ts`
- Modify: `src/project/codec.ts`
- Modify: `src/project/codec.test.ts`
- Modify: `src/hangingTissue/HangingTissuePanel.tsx`
- Modify: `src/hangingTissue/HangingTissuePanel.test.tsx`

- [ ] **Step 1: Write failing state, migration, and panel tests**

Assert these behaviors:

```ts
expect(createInitialProject().hangingTissue.radius).toBe(0)
expect(projectReducer(initial, {
  type: 'hanging-tissue/set', key: 'radius', value: 12,
}).hangingTissue.radius).toBe(12)
expect(decodeProject(JSON.stringify(version14)).hangingTissue.radius).toBe(0)
fireEvent.change(screen.getByLabelText('盒身圆角（毫米）'), { target: { value: '12' } })
expect(onChange).toHaveBeenCalledWith('radius', 12)
```

- [ ] **Step 2: Run tests and verify RED**

```bash
npm run test:run -- src/app/projectReducer.test.ts src/project/codec.test.ts src/hangingTissue/HangingTissuePanel.test.tsx
```

Expected: failures for the missing `radius` field, version 15 migration, and radius input.

- [ ] **Step 3: Add the field, reducer clamp, migration, and input**

Use these contracts:

```ts
export interface HangingTissueState {
  faces: Record<HangingTissueFace, ArtworkAsset | null>
  artworkReferenceDimensions: Record<HangingTissueFace, HangingTissueDimensions | null>
  transforms: Record<HangingTissueFace, ArtworkTransform>
  selectedFace: HangingTissueFace
  width: number
  height: number
  depth: number
  radius: number
  modelRotation: InnerPackagingModelRotation
  showPulledSheet: boolean
}

type HangingTissueDimensionKey = 'width' | 'height' | 'depth' | 'radius'

function clampHangingTissueRadius(radius: number, width: number, depth: number) {
  return Math.min(Math.max(radius, 0), Math.min(width, depth) / 2)
}
```

Increment `ProjectState.version` to `15`. Decode version 14 by adding `radius: 0`; keep earlier migrations flowing through the same final normalization. When width or depth changes, clamp the stored radius in the same reducer transaction. Render the input after depth with `min={0}`, dynamic `max={Math.min(value.width, value.depth) / 2}`, and label `盒身圆角（毫米）`.

- [ ] **Step 4: Run the selected tests and verify GREEN**

Run the Step 2 command. Expected: all selected tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/types.ts src/app/projectReducer.ts src/app/projectReducer.test.ts src/project/codec.ts src/project/codec.test.ts src/hangingTissue/HangingTissuePanel.tsx src/hangingTissue/HangingTissuePanel.test.tsx
git commit -m "feat: persist hanging tissue body radius"
```

### Task 2: Round only the middle-body cross-section

**Files:**
- Modify: `src/hangingTissue/hangingTissueDeformation.ts`
- Modify: `src/hangingTissue/hangingTissueDeformation.test.ts`
- Modify: `src/hangingTissue/PrintedHangingTissue.tsx`

- [ ] **Step 1: Write failing geometry tests**

Add representative front and side boundary vertices at middle-body, connector, and handle heights. Assert:

```ts
expect(radiusZeroPosition).toEqual(currentPosition)
expect(middleCorner.x).toBeLessThan(rectangularCorner.x)
expect(middleCorner.z).toBeLessThan(rectangularCorner.z)
expect(handlePosition).toEqual(originalHandlePosition)
expect(connectorPosition.x).toBeGreaterThan(middleCorner.x)
```

The connector assertion verifies gradual falloff rather than a hard seam.

- [ ] **Step 2: Run the geometry test and verify RED**

```bash
npm run test:run -- src/hangingTissue/hangingTissueDeformation.test.ts
```

Expected: failure because `radius`, `bodyWidth`, and `bodyDepth` are not supported.

- [ ] **Step 3: Implement rounded-rectangle boundary mapping**

Extend `HangingTissueDeformation` with `radius`, `bodyWidth`, and `bodyDepth`. Clamp radius before mapping. For front/back boundary vertices, map the corner interval with a quarter circle:

```ts
const t = (Math.abs(x) - (halfWidth - radiusX)) / radiusX
const roundedX = Math.sign(x) * (halfWidth - radiusX + radiusX * Math.sin(t * Math.PI / 2))
const roundedZ = Math.sign(z) * (halfDepth - radiusZ + radiusZ * Math.cos(t * Math.PI / 2))
```

Apply the symmetric side-face form when the normalized vertex is closer to the left/right boundary. Blend the original scaled position toward the rounded position by `horizontalWeight(y, options)`. Return unchanged coordinates when radius is zero. Recompute normals and bounds as the current function already does.

- [ ] **Step 4: Pass state into the deformation**

In `PrintedHangingTissue.tsx`, add:

```ts
radius: Math.min(value.radius, value.width / 2, value.depth / 2),
bodyWidth: value.width,
bodyDepth: value.depth,
```

Include `value.radius` in the deformation memo dependencies. Do not pass the radius to the pulled-sheet node.

- [ ] **Step 5: Run focused tests and verify GREEN**

```bash
npm run test:run -- src/hangingTissue/hangingTissueDeformation.test.ts src/hangingTissue/PrintedHangingTissue.test.ts src/scene/artworkRendererPolicy.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/hangingTissue/hangingTissueDeformation.ts src/hangingTissue/hangingTissueDeformation.test.ts src/hangingTissue/PrintedHangingTissue.tsx
git commit -m "feat: round hanging tissue middle body"
```

### Task 3: Document and verify the finished behavior

**Files:**
- Modify: `AGENTS.md`
- Modify: `Tech-Spec.md`

- [ ] **Step 1: Record the durable rule**

Document that hanging-tissue radius defaults to zero, affects only the middle-body cross-section, is capped by half the smaller width/depth, and never modifies the handle, pulled sheet, artwork transforms, or artwork-size references.

- [ ] **Step 2: Run proportional verification**

```bash
npm run test:run -- src/app/projectReducer.test.ts src/project/codec.test.ts src/hangingTissue
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: tests, typecheck, lint, build, and whitespace check pass. The existing large-chunk build warning is non-blocking.

- [ ] **Step 3: Visual verification**

In the current local preview, select 悬挂抽纸, compare radius `0` and a visible non-zero value, and confirm the middle corners change while the handle and pulled sheet retain their shapes. Check once with an uploaded front image to confirm the lit base and direct-color overlay remain aligned.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md Tech-Spec.md
git commit -m "docs: record hanging tissue radius behavior"
```
