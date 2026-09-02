# Hanging Tissue Front UV Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make front/back artwork own overlapping hanging-tissue atlas pixels without changing geometry or UV coordinates.

**Architecture:** Keep the existing single transparent atlas and per-face clipping. Change only the face draw order so side faces render first and front/back faces render last.

**Tech Stack:** TypeScript, Canvas 2D, Vitest

---

### Task 1: Enforce artwork ownership order

**Files:**
- Modify: `src/hangingTissue/hangingTissueTexture.ts`
- Test: `src/hangingTissue/hangingTissueTexture.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test that supplies four distinct image objects and asserts `drawImage` receives side images before front/back images.

- [ ] **Step 2: Verify the test fails**

Run: `npm run test:run -- src/hangingTissue/hangingTissueTexture.test.ts`

Expected: FAIL because the current order starts with `front`.

- [ ] **Step 3: Implement the minimal fix**

Use a dedicated atlas draw-order constant:

```ts
const ATLAS_DRAW_ORDER = ['left', 'right', 'back', 'front'] as const
```

Iterate over this constant in `drawHangingTissueAtlas`; keep all face extraction and geometry iteration unchanged.

- [ ] **Step 4: Verify the focused and related tests**

Run:

```bash
npm run test:run -- src/hangingTissue/hangingTissueTexture.test.ts src/hangingTissue
npm run typecheck
npm run lint
npm run build
```

Expected: all checks pass; build may retain the existing chunk-size warning.

- [ ] **Step 5: Commit**

```bash
git add src/hangingTissue/hangingTissueTexture.ts src/hangingTissue/hangingTissueTexture.test.ts
git commit -m "fix: prioritize hanging tissue front artwork"
```
