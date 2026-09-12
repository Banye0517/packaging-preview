import { describe, expect, it } from 'vitest'
import type { ArtworkAsset } from './types'
import {
  clearPackageAssets,
  clonePackageForAdd,
  createPackageInstance,
  getPackageLabel,
} from './packageFactory'

const TEST_ARTWORK: ArtworkAsset = {
  id: 'art-1',
  name: 'art.png',
  mimeType: 'image/png',
  width: 1200,
  height: 1600,
  previewUrl: 'blob:test',
}

describe('package factory', () => {
  it('creates a version 18 instance with independent default state', () => {
    const instance = createPackageInstance('box', 'box-1')

    expect(instance.id).toBe('box-1')
    expect(instance.packagingType).toBe('box')
    expect(instance.manualTransform).toBeNull()
    expect(instance.faces.front).toBeNull()
    expect(instance.box.width).toBe(160)
    expect(instance.boxFinish.layers['gold-foil'].masks.front).toBeNull()
  })

  it('copies dimensions but clears artwork and finish masks', () => {
    const source = createPackageInstance('box', 'box-1')
    source.box.width = 260
    source.faces.front = TEST_ARTWORK
    source.boxFinish.layers['gold-foil'].masks.front = {
      asset: TEST_ARTWORK,
      transform: { scale: 100, offsetX: 0, offsetY: 0, rotation: 0 },
    }
    const copy = clonePackageForAdd(source, 'box-2')

    expect(copy.id).toBe('box-2')
    expect(copy.box.width).toBe(260)
    expect(copy.faces.front).toBeNull()
    expect(copy.boxFinish.layers['gold-foil'].masks.front).toBeNull()
  })

  it('deep-copies structure and clears all artwork slots without mutating source', () => {
    const source = createPackageInstance('wet-tissue', 'wet-1')
    source.wetTissue.artworks.body = TEST_ARTWORK
    source.wetTissue.artworkReferenceDimensions.body = { width: 160, height: 205, thickness: 80 }
    source.wetTissue.transforms.body.scale = 180
    const copy = clonePackageForAdd(source, 'wet-2')

    expect(copy.wetTissue.artworks.body).toBeNull()
    expect(copy.wetTissue.artworkReferenceDimensions.body).toBeNull()
    expect(copy.wetTissue.transforms.body.scale).toBe(180)
    copy.wetTissue.transforms.body.scale = 220
    expect(source.wetTissue.transforms.body.scale).toBe(180)

    clearPackageAssets(source)
    expect(source.wetTissue.artworks.body).toBeNull()
    expect(source.wetTissue.artworkReferenceDimensions.body).toBeNull()
  })

  it('uses the localized type label and one-based occurrence number', () => {
    expect(getPackageLabel('box', 1)).toBe('六面盒型 1')
    expect(getPackageLabel('inner-packaging-1', 2)).toBe('内包装1 2')
    expect(getPackageLabel('wash-tissue', 3)).toBe('洗脸巾 3')
  })
})
