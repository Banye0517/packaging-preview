import { describe, expect, it } from 'vitest'

import { createInitialProject, projectReducer } from './projectReducer'
import type { ArtworkAsset } from './types'

describe('projectReducer', () => {
  it('initializes face tissue with one artwork, editable dimensions, and a visible top sheet', () => {
    const initial = createInitialProject()

    expect(initial.version).toBe(16)
    expect(initial.faceTissue).toEqual({
      artwork: null,
      width: 160,
      height: 205,
      thickness: 80,
      radius: 0,
      artworkReferenceDimensions: null,
      artworkTransform: {
        scale: 100,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        stretchX: 100,
        stretchY: 100,
      },
      modelRotation: 0,
      showTopSheet: true,
    })
  })

  it('updates face tissue artwork, dimensions, transforms, rotation, and top-sheet visibility', () => {
    const initial = createInitialProject()
    const asset: ArtworkAsset = {
      id: 'face-tissue-artwork',
      name: 'face-tissue.png',
      mimeType: 'image/png',
      width: 1024,
      height: 1024,
      previewUrl: 'data:image/png;base64,AAAA',
    }

    const uploaded = projectReducer(initial, {
      type: 'face-tissue/artwork-set', asset,
    })
    const changed = projectReducer(uploaded, {
      type: 'face-tissue/set', key: 'thickness', value: 96,
    })
    expect(uploaded.faceTissue.artworkReferenceDimensions).toEqual({
      width: 160, height: 205, thickness: 80,
    })
    const rounded = projectReducer(changed, {
      type: 'face-tissue/set', key: 'radius', value: 12,
    })
    const transformed = projectReducer(rounded, {
      type: 'face-tissue/transform-set', key: 'rotation', value: 45,
    })
    const rotated = projectReducer(transformed, {
      type: 'face-tissue/rotation-set', value: 90,
    })
    const hidden = projectReducer(rotated, {
      type: 'face-tissue/set-top-sheet', value: false,
    })

    expect(hidden.faceTissue.artwork).toEqual(asset)
    expect(hidden.faceTissue.thickness).toBe(96)
    expect(hidden.faceTissue.radius).toBe(12)
    expect(hidden.faceTissue.artworkTransform.rotation).toBe(45)
    expect(hidden.faceTissue.modelRotation).toBe(90)
    expect(hidden.faceTissue.showTopSheet).toBe(false)
    expect(projectReducer(hidden, {
      type: 'face-tissue/transform-set', key: 'scale', value: 301,
    })).toBe(hidden)
    expect(projectReducer(hidden, {
      type: 'face-tissue/set', key: 'width', value: 0,
    })).toBe(hidden)
    expect(projectReducer(hidden, {
      type: 'face-tissue/set', key: 'radius', value: -1,
    })).toBe(hidden)
    expect(projectReducer(hidden, {
      type: 'face-tissue/set', key: 'radius', value: 41,
    })).toBe(hidden)
  })

  it('initializes hanging tissue with four independent faces and a visible pulled sheet', () => {
    const initial = createInitialProject()

    expect(initial.version).toBe(16)
    expect(initial.hangingTissue).toEqual({
      faces: { front: null, back: null, left: null, right: null },
      artworkReferenceDimensions: { front: null, back: null, left: null, right: null },
      transforms: {
        front: { scale: 100, offsetX: 0, offsetY: 0, rotation: 0, stretchX: 100, stretchY: 100 },
        back: { scale: 100, offsetX: 0, offsetY: 0, rotation: 0, stretchX: 100, stretchY: 100 },
        left: { scale: 100, offsetX: 0, offsetY: 0, rotation: 0, stretchX: 100, stretchY: 100 },
        right: { scale: 100, offsetX: 0, offsetY: 0, rotation: 0, stretchX: 100, stretchY: 100 },
      },
      selectedFace: 'front',
      width: 160,
      height: 205,
      depth: 80,
      modelRotation: 0,
      showPulledSheet: true,
    })
  })

  it('updates all hanging tissue body dimensions and rejects invalid values', () => {
    const initial = createInitialProject()
    const resized = projectReducer(initial, {
      type: 'hanging-tissue/set', key: 'depth', value: 96,
    })

    expect(resized.hangingTissue.depth).toBe(96)
    expect(projectReducer(resized, {
      type: 'hanging-tissue/set', key: 'depth', value: Number.NaN,
    })).toBe(resized)
    expect(projectReducer(resized, {
      type: 'hanging-tissue/set', key: 'width', value: 29,
    })).toBe(resized)
    expect(projectReducer(resized, {
      type: 'hanging-tissue/set', key: 'height', value: 1001,
    })).toBe(resized)

  })

  it('updates one hanging tissue face and toggles only the pulled sheet', () => {
    const initial = createInitialProject()
    const asset: ArtworkAsset = {
      id: 'left-artwork',
      name: 'left.png',
      mimeType: 'image/png',
      width: 1000,
      height: 1400,
      previewUrl: 'data:image/png;base64,AAAA',
    }

    const uploaded = projectReducer(initial, {
      type: 'hanging-tissue/face-set', face: 'left', asset,
      referenceDimensions: { width: 160, height: 205, depth: 80 },
    })
    const hidden = projectReducer(uploaded, {
      type: 'hanging-tissue/set-pulled-sheet', value: false,
    })

    expect(uploaded.hangingTissue.faces.left).toEqual(asset)
    expect(uploaded.hangingTissue.artworkReferenceDimensions.left).toEqual({
      width: 160, height: 205, depth: 80,
    })
    expect(uploaded.hangingTissue.faces.front).toBeNull()
    expect(hidden.hangingTissue.showPulledSheet).toBe(false)
    expect(hidden.innerPackaging2).toEqual(initial.innerPackaging2)

    const removed = projectReducer(uploaded, {
      type: 'hanging-tissue/face-remove', face: 'left',
    })
    expect(removed.hangingTissue.artworkReferenceDimensions.left).toBeNull()
  })

  it('initializes inner packaging 2 with independent front and back transforms', () => {
    const initial = createInitialProject()

    expect(initial.version).toBe(16)
    expect(initial.innerPackaging2).toEqual({
      faces: { front: null, back: null },
      transforms: {
        front: { scale: 100, offsetX: 0, offsetY: 0, rotation: 0, stretchX: 100, stretchY: 100 },
        back: { scale: 100, offsetX: 0, offsetY: 0, rotation: 0, stretchX: 100, stretchY: 100 },
      },
      selectedFace: 'front',
      width: 160,
      height: 205,
      modelRotation: 0,
    })
  })

  it('updates and resets one inner packaging 2 face without changing the other', () => {
    const initial = createInitialProject()
    const asset: ArtworkAsset = {
      id: 'inner-2-front',
      name: 'front.png',
      mimeType: 'image/png',
      width: 1200,
      height: 1600,
      previewUrl: 'data:image/png;base64,AAAA',
    }
    const uploaded = projectReducer(initial, {
      type: 'inner-packaging-2/face-set',
      face: 'front',
      asset,
    })
    const transformed = projectReducer(uploaded, {
      type: 'inner-packaging-2/transform-set',
      face: 'front',
      key: 'rotation',
      value: 45,
    })
    const reset = projectReducer(transformed, {
      type: 'inner-packaging-2/transform-reset',
      face: 'front',
    })

    expect(uploaded.innerPackaging2.faces.front).toEqual(asset)
    expect(uploaded.innerPackaging2.faces.back).toBeNull()
    expect(transformed.innerPackaging2.transforms.front.rotation).toBe(45)
    expect(transformed.innerPackaging2.transforms.back.rotation).toBe(0)
    expect(reset.innerPackaging2.transforms.front).toEqual({
      scale: 100,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      stretchX: 100,
      stretchY: 100,
    })
  })

  it('rejects invalid inner packaging 2 dimensions, transforms, and rotations', () => {
    const initial = createInitialProject()

    expect(projectReducer(initial, {
      type: 'inner-packaging-2/set', key: 'height', value: 0,
    })).toBe(initial)
    expect(projectReducer(initial, {
      type: 'inner-packaging-2/transform-set', face: 'front', key: 'scale', value: 301,
    })).toBe(initial)
    expect(projectReducer(initial, {
      type: 'inner-packaging-2/transform-set', face: 'back', key: 'offsetX', value: -101,
    })).toBe(initial)
    expect(projectReducer(initial, {
      type: 'inner-packaging-2/transform-set', face: 'front', key: 'stretchX', value: 50,
    }).innerPackaging2.transforms.front.stretchX).toBe(50)
    expect(projectReducer(initial, {
      type: 'inner-packaging-2/transform-set', face: 'front', key: 'stretchY', value: 301,
    })).toBe(initial)
    expect(projectReducer(initial, {
      type: 'inner-packaging-2/rotation-set', value: 45,
    })).toBe(initial)
  })

  it('replaces only the addressed face', () => {
    const initialProject = createInitialProject()
    const asset: ArtworkAsset = {
      id: 'front-asset',
      name: 'front.png',
      mimeType: 'image/png',
      width: 1200,
      height: 1600,
      previewUrl: 'blob:front',
    }

    const next = projectReducer(initialProject, {
      type: 'face/set',
      face: 'front',
      asset,
    })

    expect(next.faces.front).toEqual(asset)
    expect(next.faces.back).toBeNull()
    expect(next.faces.top).toBeNull()
  })

  it('clears one face without changing the others', () => {
    const asset: ArtworkAsset = {
      id: 'front-asset',
      name: 'front.png',
      mimeType: 'image/png',
      width: 1200,
      height: 1600,
      previewUrl: 'blob:front',
    }
    const populated = projectReducer(createInitialProject(), {
      type: 'face/set',
      face: 'front',
      asset,
    })

    const next = projectReducer(populated, {
      type: 'face/remove',
      face: 'front',
    })

    expect(next.faces.front).toBeNull()
    expect(next.faces.back).toBe(populated.faces.back)
  })

  it('updates one box dimension without changing the other dimensions', () => {
    const initial = createInitialProject()
    const next = projectReducer(initial, {
      type: 'box/set',
      key: 'width',
      value: 185,
    })

    expect(next.box.width).toBe(185)
    expect(next.box.height).toBe(initial.box.height)
    expect(next.box.depth).toBe(initial.box.depth)
  })

  it('keeps box and pouch state independently while switching type', () => {
    const initial = createInitialProject()
    const pouch = projectReducer(initial, {
      type: 'packaging/type',
      value: 'pouch',
    })
    const changed = projectReducer(pouch, {
      type: 'pouch/set',
      key: 'thickness',
      value: 18,
    })
    const box = projectReducer(changed, {
      type: 'packaging/type',
      value: 'box',
    })

    expect(box.packagingType).toBe('box')
    expect(box.box).toEqual(initial.box)
    expect(box.pouch.thickness).toBe(18)
  })

  it('updates pouch closure as one mutually exclusive value', () => {
    const next = projectReducer(createInitialProject(), {
      type: 'pouch/set',
      key: 'closure',
      value: 'spout',
    })

    expect(next.pouch.closure).toBe('spout')
  })

  it('rejects non-positive pouch dimensions', () => {
    const initial = createInitialProject()
    const next = projectReducer(initial, {
      type: 'pouch/set',
      key: 'thickness',
      value: 0,
    })

    expect(next).toBe(initial)
  })

  it('keeps inner packaging state independent from pouch state', () => {
    const initial = createInitialProject()
    const selected = projectReducer(initial, {
      type: 'packaging/type',
      value: 'inner-packaging-1',
    })
    const changed = projectReducer(selected, {
      type: 'inner-packaging-1/set',
      key: 'width',
      value: 188,
    })

    expect(changed.packagingType).toBe('inner-packaging-1')
    expect(changed.innerPackaging1.width).toBe(188)
    expect(changed.pouch.width).toBe(initial.pouch.width)
  })

  it('stores only supported inner packaging model rotations', () => {
    const initial = createInitialProject()
    const rotated = projectReducer(initial, {
      type: 'inner-packaging-1/rotation-set',
      value: 90,
    })
    const rejected = projectReducer(rotated, {
      type: 'inner-packaging-1/rotation-set',
      value: 45,
    })

    expect(rotated.innerPackaging1.modelRotation).toBe(90)
    expect(rejected).toBe(rotated)
  })

  it('stores one full UV artwork for inner packaging', () => {
    const initial = createInitialProject()
    const asset: ArtworkAsset = {
      id: 'inner-uv',
      name: 'inner-uv.png',
      mimeType: 'image/png',
      width: 1024,
      height: 1024,
      previewUrl: 'blob:inner-uv',
    }

    const next = projectReducer(initial, {
      type: 'inner-packaging-1/artwork-set',
      asset,
    })

    expect(next.innerPackaging1.artwork).toEqual(asset)
    expect(next.pouch.faces).toEqual(initial.pouch.faces)
  })

  it('updates and resets inner packaging artwork transform', () => {
    const initial = createInitialProject()
    const scaled = projectReducer(initial, {
      type: 'inner-packaging-1/transform-set',
      key: 'artworkScale',
      value: 175,
    })
    const moved = projectReducer(scaled, {
      type: 'inner-packaging-1/transform-set',
      key: 'artworkOffsetX',
      value: -24,
    })
    const reset = projectReducer(moved, {
      type: 'inner-packaging-1/transform-reset',
    })

    expect(moved.innerPackaging1.artworkScale).toBe(175)
    expect(moved.innerPackaging1.artworkOffsetX).toBe(-24)
    expect(reset.innerPackaging1).toMatchObject({
      artworkScale: 100,
      artworkOffsetX: 0,
      artworkOffsetY: 0,
      artworkRotation: 0,
      artworkStretchX: 100,
      artworkStretchY: 100,
    })
  })

  it('updates inner packaging rotation and independent stretch', () => {
    const initial = createInitialProject()
    const rotated = projectReducer(initial, {
      type: 'inner-packaging-1/transform-set',
      key: 'artworkRotation',
      value: -45,
    })
    const stretchedX = projectReducer(rotated, {
      type: 'inner-packaging-1/transform-set',
      key: 'artworkStretchX',
      value: 140,
    })
    const stretchedY = projectReducer(stretchedX, {
      type: 'inner-packaging-1/transform-set',
      key: 'artworkStretchY',
      value: 75,
    })

    expect(stretchedY.innerPackaging1).toMatchObject({
      artworkRotation: -45,
      artworkStretchX: 140,
      artworkStretchY: 75,
    })
  })

  it('rejects out-of-range inner packaging artwork transform values', () => {
    const initial = createInitialProject()

    expect(projectReducer(initial, {
      type: 'inner-packaging-1/transform-set',
      key: 'artworkScale',
      value: 301,
    })).toBe(initial)
    expect(projectReducer(initial, {
      type: 'inner-packaging-1/transform-set',
      key: 'artworkRotation',
      value: 181,
    })).toBe(initial)
    expect(projectReducer(initial, {
      type: 'inner-packaging-1/transform-set',
      key: 'artworkStretchX',
      value: 49,
    })).toBe(initial)
    expect(projectReducer(initial, {
      type: 'inner-packaging-1/transform-set',
      key: 'artworkOffsetY',
      value: -101,
    })).toBe(initial)
  })

  it('rejects non-positive inner packaging dimensions', () => {
    const initial = createInitialProject()
    const next = projectReducer(initial, {
      type: 'inner-packaging-1/set',
      key: 'height',
      value: 0,
    })

    expect(next).toBe(initial)
  })

  it('stores and transforms one box finish mask without changing other faces', () => {
    const initial = createInitialProject()
    const asset: ArtworkAsset = {
      id: 'gold-front',
      name: 'gold-front.png',
      mimeType: 'image/png',
      width: 1000,
      height: 1000,
      previewUrl: 'data:image/png;base64,AAAA',
    }
    const uploaded = projectReducer(initial, {
      type: 'box-finish/mask-set',
      kind: 'gold-foil',
      face: 'front',
      asset,
    })
    const transformed = projectReducer(uploaded, {
      type: 'box-finish/mask-transform-set',
      kind: 'gold-foil',
      face: 'front',
      key: 'rotation',
      value: 45,
    })

    expect(transformed.boxFinish.layers['gold-foil'].masks.front).toMatchObject({
      asset,
      transform: { scale: 100, offsetX: 0, offsetY: 0, rotation: 45 },
    })
    expect(transformed.boxFinish.layers['gold-foil'].masks.back).toBeNull()
  })

  it('stores a pouch finish mask independently from box masks', () => {
    const asset: ArtworkAsset = {
      id: 'pouch-gold-front', name: 'pouch-gold-front.png', mimeType: 'image/png',
      width: 1000, height: 1000, previewUrl: 'data:image/png;base64,AAAA',
    }
    const next = projectReducer(createInitialProject(), {
      type: 'pouch-finish/mask-set', kind: 'gold-foil', face: 'front', asset,
    })

    expect(next.pouchFinish.layers['gold-foil'].masks.front?.asset).toEqual(asset)
    expect(next.boxFinish.layers['gold-foil'].masks.front).toBeNull()
  })

  it('edits and clears pouch finish state independently from box finish state', () => {
    const asset: ArtworkAsset = {
      id: 'pouch-silver-back', name: 'pouch-silver-back.png', mimeType: 'image/png',
      width: 1000, height: 1000, previewUrl: 'data:image/png;base64,AAAA',
    }
    const selected = projectReducer(createInitialProject(), {
      type: 'pouch-finish/select-kind', kind: 'silver-foil',
    })
    const uploaded = projectReducer(selected, {
      type: 'pouch-finish/mask-set', kind: 'silver-foil', face: 'back', asset,
    })
    const transformed = projectReducer(uploaded, {
      type: 'pouch-finish/mask-transform-set', kind: 'silver-foil', face: 'back', key: 'rotation', value: 35,
    })
    const disabled = projectReducer(transformed, {
      type: 'pouch-finish/enabled-set', kind: 'silver-foil', value: false,
    })
    const cleared = projectReducer(disabled, {
      type: 'pouch-finish/masks-clear', kind: 'silver-foil',
    })

    expect(transformed.pouchFinish.selectedKind).toBe('silver-foil')
    expect(transformed.pouchFinish.layers['silver-foil'].masks.back?.transform.rotation).toBe(35)
    expect(disabled.pouchFinish.layers['silver-foil'].enabled).toBe(false)
    expect(Object.values(cleared.pouchFinish.layers['silver-foil'].masks)).toEqual([null, null])
    expect(cleared.boxFinish).toEqual(createInitialProject().boxFinish)
  })

  it('rejects out-of-range finish mask transforms', () => {
    const initial = createInitialProject()

    expect(projectReducer(initial, {
      type: 'box-finish/mask-transform-set',
      kind: 'gold-foil',
      face: 'front',
      key: 'scale',
      value: 301,
    })).toBe(initial)
  })

  it('rejects out-of-range and unsupported finish material parameters', () => {
    const initial = createInitialProject()

    expect(projectReducer(initial, {
      type: 'box-finish/parameter-set', kind: 'gold-foil', key: 'roughness', value: 1.1,
    })).toBe(initial)
    expect(projectReducer(initial, {
      type: 'box-finish/parameter-set', kind: 'spot-uv', key: 'grain', value: 20,
    })).toBe(initial)
  })
})
