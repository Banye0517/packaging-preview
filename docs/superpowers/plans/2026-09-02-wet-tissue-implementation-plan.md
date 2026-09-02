# Wet Tissue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the 湿纸巾 packaging type with open/closed model states, two authored-UV artwork uploads, paper visibility, shared artwork transforms, and non-stretching dimension edits.

**Architecture:** Reuse the existing project reducer, artwork validation, disclosure controls, and R3F renderer patterns. The supplied GLTF is byte-identical in both files and contains both roots, so one copied public asset is loaded once; the renderer selects `湿巾纸开` or `湿巾纸`, uses the `袋子` mesh for the body artwork, `1` for the lid artwork, and keeps structural meshes lit. Each artwork stores upload-time dimensions and is drawn into its own transparent atlas with authored UVs preserved; dimension changes compensate atlas placement instead of scaling the artwork with geometry.

**Tech Stack:** React 19, TypeScript, React Three Fiber, Three.js, Vitest, Testing Library, Vite, Ego browser.

---

### Task 1: Model contract and state

**Files:**
- Create: `src/wetTissue/wetTissueModel.ts`, `src/wetTissue/wetTissueDeformation.ts`
- Modify: `src/app/types.ts`, `src/app/projectReducer.ts`
- Test: `src/wetTissue/wetTissueModel.test.ts`, `src/wetTissue/wetTissueDeformation.test.ts`, `src/app/projectReducer.test.ts`

- [ ] Write failing tests for the two root names, body/lid mesh responsibilities, default open/paper-visible state, bounded transforms, upload-time references, and width/height/thickness updates.
- [ ] Run the targeted tests and confirm they fail because the wet-tissue contract is absent.
- [ ] Add `WetTissueState`, `wet-tissue` actions, defaults, and model/deformation helpers with the same transform limits as hanging tissue.
- [ ] Run the targeted tests and confirm they pass.

### Task 2: Artwork atlas and renderer

**Files:**
- Create: `src/wetTissue/wetTissueTexture.ts`, `src/wetTissue/PrintedWetTissue.tsx`
- Modify: `src/scene/BoxScene.tsx`, `src/scene/artworkRendererPolicy.test.ts`, `src/scene/BoxScene.test.tsx`
- Test: `src/wetTissue/wetTissueTexture.test.ts`, `src/wetTissue/PrintedWetTissue.test.ts`

- [ ] Write failing tests for separate body/lid atlases, transparent uncovered areas, authored UV retention, selected root rendering, and paper visibility.
- [ ] Run the targeted tests and confirm the renderer/atlas behavior is missing.
- [ ] Copy the single verified GLTF to `public/models/wet-tissue.gltf`; implement root selection, authored-UV geometry deformation, direct-color artwork materials, lit structural materials, and paper visibility.
- [ ] Run targeted renderer/texture tests and confirm they pass.

### Task 3: Controls, persistence, and app integration

**Files:**
- Create: `src/wetTissue/WetTissueArtworkUploader.tsx`, `src/wetTissue/WetTissuePanel.tsx`, and their tests
- Modify: `src/app/App.tsx`, `src/project/codec.ts`, `src/app/App.test.tsx`, `src/project/codec.test.ts`

- [ ] Write failing tests for exactly two upload cards, collapsed advanced adjustment, open/closed selection, paper switch, dimensions, and project round-trip/migration defaults.
- [ ] Run targeted tests and confirm the UI and codec cases fail before integration.
- [ ] Wire the new type through upload/remove handlers, the four existing settings areas, artwork/box/finish copy, and project decoding without changing old packaging behavior.
- [ ] Run targeted tests and confirm they pass.

### Task 4: Full verification and browser QA

**Files:**
- Modify only files required by failing checks.

- [ ] Run `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run build`, and `npm run test:sites`.
- [ ] Start the local Vite server on the project port and use Ego browser to switch to 湿纸巾, upload the two supplied PSD-derived PNGs, switch open/closed, toggle paper, expand advanced controls, change dimensions, and verify the 3D canvas and console.
- [ ] Capture a canvas screenshot for visual evidence, preserve unrelated untracked files, and report the stable URL plus any remaining asset limitation.
