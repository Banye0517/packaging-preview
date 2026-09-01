# Global Artwork Color Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render every ordinary uploaded packaging artwork with direct sRGB color in preview and PNG export while retaining lighting on structure and finish materials.

**Architecture:** Introduce one shared unlit artwork-material factory based on `MeshBasicMaterial`, pure white multiplication, and disabled tone mapping. Route the five packaging renderers through that policy; leave fallback structure, seals, paper, shadows, and finish overlays on their existing lit materials.

**Tech Stack:** React 19, TypeScript, Three.js, React Three Fiber, Vitest, Vite.

---

### Task 1: Create the shared direct-color artwork material

**Files:**
- Create: `src/scene/artworkMaterial.ts`
- Create: `src/scene/artworkMaterial.test.ts`
- Modify: `src/scene/textureMaterial.ts`

- [ ] **Step 1: Write the failing material contract test**

```ts
const texture = new Texture()
const material = createArtworkMaterial(texture, DoubleSide)
expect(material).toBeInstanceOf(MeshBasicMaterial)
expect(material.color.getHexString()).toBe('ffffff')
expect(material.map).toBe(texture)
expect(material.toneMapped).toBe(false)
expect(material.side).toBe(DoubleSide)
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:run -- src/scene/artworkMaterial.test.ts`

Expected: FAIL because the factory does not exist.

- [ ] **Step 3: Implement the shared policy**

```ts
export function createArtworkMaterial(texture: Texture | null, side = FrontSide) {
  return new MeshBasicMaterial({
    color: '#ffffff',
    map: texture,
    side,
    toneMapped: false,
  })
}
```

Change `applyTextureMap` to accept `Material & { map: Texture | null }` so Basic and Standard materials can share texture binding without unsafe casts.

- [ ] **Step 4: Run focused tests and typecheck**

Run: `npm run test:run -- src/scene/artworkMaterial.test.ts src/innerPackaging/PrintedInnerPackaging1.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scene/artworkMaterial.ts src/scene/artworkMaterial.test.ts src/scene/textureMaterial.ts
git commit -m "feat: add direct-color artwork material"
```

### Task 2: Apply the policy to all five packaging renderers

**Files:**
- Modify: `src/scene/PrintedBox.tsx`
- Modify: `src/pouch/PrintedPouch.tsx`
- Modify: `src/innerPackaging/PrintedInnerPackaging1.tsx`
- Modify: `src/innerPackaging/PrintedInnerPackaging2.tsx`
- Modify: `src/hangingTissue/PrintedHangingTissue.tsx`
- Modify: `src/hangingTissue/hangingTissueModel.ts`
- Modify: `src/hangingTissue/PrintedHangingTissue.test.ts`
- Create: `src/scene/artworkRendererPolicy.test.ts`

- [ ] **Step 1: Write failing renderer policy tests**

Read the five renderer source modules as raw strings and assert each imports or uses `createArtworkMaterial`/`meshBasicMaterial` for uploaded artwork, while hanging tissue no longer references emissive compensation.

```ts
expect(printedBoxSource).toContain('meshBasicMaterial')
expect(printedPouchSource).toContain('meshBasicMaterial')
expect(inner1Source).toContain('meshBasicMaterial')
expect(inner2Source).toContain('meshBasicMaterial')
expect(hangingSource).toContain('createArtworkMaterial')
expect(hangingSource).not.toContain('emissiveMap')
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:run -- src/scene/artworkRendererPolicy.test.ts src/hangingTissue/PrintedHangingTissue.test.ts`

Expected: FAIL because all uploaded artwork currently uses Standard material and hanging tissue uses emissive compensation.

- [ ] **Step 3: Convert declarative renderer materials**

For box, pouch, inner packaging 1, and inner packaging 2, change only uploaded-texture material elements to `<meshBasicMaterial color="#ffffff" toneMapped={false} ... />`. Keep no-image fallbacks and every structure material as Standard. Preserve each current `side` value.

- [ ] **Step 4: Convert hanging-tissue runtime materials**

Replace runtime `new MeshStandardMaterial(...)` for four artwork faces with `createArtworkMaterial(textures[index], BackSide)`. Remove the emissive policy constant and emissive-map assignment. Keep remainder materials as Standard.

- [ ] **Step 5: Run renderer and packaging tests**

Run: `npm run test:run -- src/scene src/pouch src/innerPackaging src/hangingTissue`

Expected: PASS; finish overlays and structure contracts remain unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/scene/PrintedBox.tsx src/pouch/PrintedPouch.tsx src/innerPackaging/PrintedInnerPackaging1.tsx src/innerPackaging/PrintedInnerPackaging2.tsx src/hangingTissue/PrintedHangingTissue.tsx src/hangingTissue/hangingTissueModel.ts src/hangingTissue/PrintedHangingTissue.test.ts src/scene/artworkRendererPolicy.test.ts
git commit -m "fix: prioritize source artwork colors across packaging"
```

### Task 3: Record the global rule and run lightweight completion checks

**Files:**
- Modify: `AGENTS.md`
- Modify: `Tech-Spec.md`

- [ ] **Step 1: Update durable rules**

Document direct sRGB color as the default for current and future packaging artwork, plus the explicit structure/finish exclusions.

- [ ] **Step 2: Run checks**

```bash
npm run test:run -- src/scene src/pouch src/innerPackaging src/hangingTissue
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: all pass; existing Vite chunk-size warning may remain.

- [ ] **Step 3: Browser/export check**

Use one saturated sRGB image in one representative box and the hanging-tissue model, compare preview and transparent PNG against the source, and inspect console errors. If file automation remains unavailable, report this limitation rather than treating build success as visual proof.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md Tech-Spec.md
git commit -m "docs: require source-color artwork rendering"
```
