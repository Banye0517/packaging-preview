import { ClampToEdgeWrapping, Texture } from 'three'
import { describe, expect, it } from 'vitest'

import {
  configureFinishMaskTexture,
  buildFinishMaskCoverage,
  createHolographicFilmTexture,
  createMetalFilmTexture,
  getFinishMaskCoverage,
  getHolographicGradientPosition,
  getHolographicGradientStops,
} from './finishTexture'

describe('configureFinishMaskTexture', () => {
  it('uses centered clamp-to-edge transforms without repeating', () => {
    const texture = new Texture()

    configureFinishMaskTexture(texture, {
      scale: 200,
      offsetX: 25,
      offsetY: -10,
      rotation: 90,
    })

    expect(texture.wrapS).toBe(ClampToEdgeWrapping)
    expect(texture.wrapT).toBe(ClampToEdgeWrapping)
    expect(texture.repeat.x).toBeCloseTo(0.5)
    expect(texture.repeat.y).toBeCloseTo(0.5)
    expect(texture.center.toArray()).toEqual([0.5, 0.5])
    expect(texture.offset.x).toBeCloseTo(0.25)
    expect(texture.offset.y).toBeCloseTo(-0.1)
    expect(texture.rotation).toBeCloseTo(Math.PI / 2)
  })
})

describe('finish texture pixels', () => {
  it('turns grayscale artwork details into one opaque finish region', () => {
    expect(getFinishMaskCoverage(0, 0, 0, 255)).toBe(1)
    expect(getFinishMaskCoverage(120, 120, 120, 255)).toBe(1)
    expect(getFinishMaskCoverage(210, 210, 210, 255)).toBe(1)
    expect(getFinishMaskCoverage(255, 255, 255, 255)).toBe(0)
    expect(getFinishMaskCoverage(0, 0, 0, 0)).toBe(0)
  })

  it('fills pale details enclosed by a dark subject silhouette', () => {
    const width = 5
    const height = 5
    const pixels = new Uint8ClampedArray(width * height * 4).fill(255)
    const setGray = (x: number, y: number, value: number) => {
      const offset = (y * width + x) * 4
      pixels[offset] = value
      pixels[offset + 1] = value
      pixels[offset + 2] = value
    }
    for (let index = 1; index < 4; index += 1) {
      setGray(index, 1, 0)
      setGray(index, 3, 0)
      setGray(1, index, 0)
      setGray(3, index, 0)
    }

    const coverage = buildFinishMaskCoverage(pixels, width, height)

    expect(coverage[0]).toBe(0)
    expect(coverage[2 * width + 2]).toBe(1)
  })

  it('defines the broad pastel spectrum visible in the reference holographic film', () => {
    expect(getHolographicGradientStops().map((stop) => stop.color)).toEqual([
      '#6f3fc2', '#86afea', '#d5efef', '#79b88c',
    ])
  })

  it('builds the holographic film as a GPU-ready data texture', () => {
    const texture = createHolographicFilmTexture()

    expect(texture?.isDataTexture).toBe(true)
    expect(texture?.image.width).toBe(256)
    expect(texture?.image.height).toBe(256)
    expect(texture?.repeat.toArray()).toEqual([1, 1])
    expect(texture?.offset.toArray()).toEqual([0, 0])
    expect(texture?.rotation).toBe(0)
  })

  it('builds static gold and silver films with visible tonal contrast', () => {
    const gold = createMetalFilmTexture('gold-foil')
    const silver = createMetalFilmTexture('silver-foil')
    const goldValues = Array.from(gold.image.data as Uint8Array)
    const silverValues = Array.from(silver.image.data as Uint8Array)
    const range = (values: number[]) => values.reduce(
      (current, value) => ({ min: Math.min(current.min, value), max: Math.max(current.max, value) }),
      { min: 255, max: 0 },
    )

    expect(gold.isDataTexture).toBe(true)
    expect(silver.isDataTexture).toBe(true)
    expect(range(goldValues).max - range(goldValues).min).toBeGreaterThan(80)
    expect(range(silverValues).max - range(silverValues).min).toBeGreaterThan(70)
    expect(gold.repeat.toArray()).toEqual([1, 1])
    expect(gold.offset.toArray()).toEqual([0, 0])
  })

  it('anchors purple on the left and green on the right like the reference', () => {
    expect(getHolographicGradientPosition(0, 200, 256)).toBe(0)
    expect(getHolographicGradientPosition(255, 20, 256)).toBe(1)
  })
})
