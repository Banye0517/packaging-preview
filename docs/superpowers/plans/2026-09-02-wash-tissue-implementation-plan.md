# Wash Tissue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the 洗脸巾 packaging type with one authored-UV artwork upload, editable dimensions, a top-paper visibility switch, and the same collapsed transform controls as the existing tissue packaging types.

**Architecture:** Reuse `FaceTissueState`, reducer conventions, full-UV artwork controls, dimension compensation, and `deformFaceTissueGeometry`. Add a model-specific loader/renderer for `洗脸巾1开`, `洗脸巾`, `平面`, and `纸`; preserve the supplied UV and keep the unprinted plane/paper physically lit. Copy only the supplied GLTF once to `public/models/wash-tissue.gltf`.

**Tech Stack:** React 19, TypeScript, React Three Fiber, Three.js, Vitest, Testing Library, Vite, Ego browser.

---

### Task 1: Model, state, and persistence contract

**Files:** `src/washTissue/washTissueModel.ts`, tests, `src/app/types.ts`, `src/app/projectReducer.ts`, `src/project/codec.ts`, tests.

- [ ] Write failing tests for model node responsibilities, default visible paper, one artwork, bounded transforms, dimensions, and codec round-trip/migration defaults.
- [ ] Run targeted tests and confirm the new contract is absent.
- [ ] Implement the model constants, `washTissue: FaceTissueState`, reducer actions/defaults, and backward-compatible codec hydration.
- [ ] Run targeted tests and confirm they pass.

### Task 2: UV renderer and shared controls

**Files:** `src/washTissue/PrintedWashTissue.tsx`, `src/scene/BoxScene.tsx`, `src/faceTissue/FaceTissuePanel.tsx`, `src/faceTissue/FaceTissueArtworkUploader.tsx`, renderer tests.

- [ ] Write failing tests for the selected GLTF nodes, direct-color artwork, lit structure, authored UV preservation, and paper visibility.
- [ ] Implement the renderer and parameterize the existing full-UV panel/uploader labels so 面纸 behavior remains unchanged.
- [ ] Run targeted renderer and existing face-tissue tests.

### Task 3: App integration and verification

**Files:** `src/app/App.tsx`, app tests, `AGENTS.md`.

- [ ] Add the packaging switch, upload/remove handler, artwork/box/finish copy, and exactly one artwork input.
- [ ] Run the full test suite, typecheck, lint, build, and Sites checks.
- [ ] Use Ego browser to upload `未标题_2.psd` converted to PNG, toggle the paper, change dimensions, open advanced controls, and inspect the real canvas.
