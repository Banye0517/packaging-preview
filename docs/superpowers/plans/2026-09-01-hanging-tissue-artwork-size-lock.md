# Hanging Tissue Artwork Size Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep each hanging-tissue artwork's uploaded physical size and aspect unchanged when body width, height, or depth changes.

**Architecture:** Store an independent upload-time body-dimension reference per face in versioned project state. Pass current and reference face dimensions into the atlas renderer, which applies inverse body scaling before existing user transforms and UV clipping.

**Tech Stack:** React 19, TypeScript, Three.js CanvasTexture, Vitest, Vite.

---

### Task 1: Persist per-face artwork reference dimensions

**Files:**
- Modify: `src/app/types.ts`
- Modify: `src/app/projectReducer.ts`
- Modify: `src/app/projectReducer.test.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/project/codec.ts`
- Modify: `src/project/codec.test.ts`

- [ ] **Step 1: Write failing reducer and migration tests**

Assert default references are null, setting an artwork captures only that face's current dimensions, replacement refreshes that face, removal clears it, and a version-13 project migrates to version 14 using its current dimensions for uploaded faces.

```ts
expect(initial.hangingTissue.artworkReferenceDimensions).toEqual({
  front: null, back: null, left: null, right: null,
})

const uploaded = projectReducer(initial, {
  type: 'hanging-tissue/face-set',
  face: 'front',
  asset,
  referenceDimensions: { width: 160, height: 205, depth: 80 },
})
expect(uploaded.hangingTissue.artworkReferenceDimensions.front).toEqual({
  width: 160, height: 205, depth: 80,
})
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm run test:run -- src/app/projectReducer.test.ts src/project/codec.test.ts`

Expected: FAIL because references and version 14 do not exist.

- [ ] **Step 3: Implement state, actions, upload wiring, and migration**

Add the shared type and state field:

```ts
export interface HangingTissueDimensions {
  width: number
  height: number
  depth: number
}

artworkReferenceDimensions: Record<HangingTissueFace, HangingTissueDimensions | null>
```

Extend `hanging-tissue/face-set` with `referenceDimensions`. In `App.tsx`, dispatch a snapshot of the current `project.hangingTissue` dimensions after image validation. Clear the matching reference on remove. Upgrade `ProjectState.version` to 14 and migrate version 13 by assigning current dimensions only to non-null faces.

- [ ] **Step 4: Run focused tests**

Run: `npm run test:run -- src/app/projectReducer.test.ts src/project/codec.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/types.ts src/app/projectReducer.ts src/app/projectReducer.test.ts src/app/App.tsx src/project/codec.ts src/project/codec.test.ts
git commit -m "feat: persist hanging tissue artwork size references"
```

### Task 2: Counter-scale atlas artwork against body dimensions

**Files:**
- Modify: `src/hangingTissue/hangingTissueTexture.ts`
- Modify: `src/hangingTissue/hangingTissueTexture.test.ts`
- Modify: `src/hangingTissue/PrintedHangingTissue.tsx`

- [ ] **Step 1: Write failing texture-size tests**

Export a pure compensation helper and assert front/back use width-height while left/right use depth-height.

```ts
expect(calculateArtworkDimensionCompensation('front', current, reference)).toEqual({
  x: 0.5,
  y: 2,
})
expect(calculateArtworkDimensionCompensation('left', current, reference)).toEqual({
  x: 0.8,
  y: 2,
})
```

Use `current = { width: 320, height: 100, depth: 100 }` and `reference = { width: 160, height: 200, depth: 80 }`.

- [ ] **Step 2: Run the texture test and verify failure**

Run: `npm run test:run -- src/hangingTissue/hangingTissueTexture.test.ts`

Expected: FAIL because the compensation helper does not exist.

- [ ] **Step 3: Implement inverse compensation**

Extend each atlas face input with current/reference dimensions and multiply the existing calculated draw width and height after the normal image-cover and user-transform calculation.

```ts
export function calculateArtworkDimensionCompensation(
  face: HangingTissueFace,
  current: HangingTissueDimensions,
  reference: HangingTissueDimensions,
) {
  return {
    x: (face === 'front' || face === 'back' ? reference.width / current.width : reference.depth / current.depth),
    y: reference.height / current.height,
  }
}
```

`PrintedHangingTissue` passes each face's saved reference and current dimensions. A missing reference uses current dimensions, producing neutral compensation.

- [ ] **Step 4: Run hanging-tissue tests**

Run: `npm run test:run -- src/hangingTissue`

Expected: PASS with unchanged UV clipping, transforms, exterior rendering, and geometry deformation tests.

- [ ] **Step 5: Commit**

```bash
git add src/hangingTissue/hangingTissueTexture.ts src/hangingTissue/hangingTissueTexture.test.ts src/hangingTissue/PrintedHangingTissue.tsx
git commit -m "feat: lock hanging tissue artwork display size"
```

### Task 3: Document and verify the locked-size contract

**Files:**
- Modify: `AGENTS.md`
- Modify: `Tech-Spec.md`

- [ ] **Step 1: Update durable project rules**

Record upload-time face references, inverse width/depth/height compensation, grow-to-white and shrink-to-crop behavior, and version-14 migration.

- [ ] **Step 2: Run lightweight completion checks**

Run:

```bash
npm run test:run -- src/hangingTissue src/app/projectReducer.test.ts src/project/codec.test.ts
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: all pass; the existing non-blocking Vite chunk-size warning may remain.

- [ ] **Step 3: Run one browser interaction check**

Upload one representative image, change width, height, and depth once, and verify the model changes while the artwork's visible physical bounds remain stable. Confirm no relevant console error. If browser file upload remains unavailable, report that exact limitation and rely on pure texture/reducer coverage without claiming visual upload acceptance.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md Tech-Spec.md
git commit -m "docs: record hanging tissue artwork size lock"
```
