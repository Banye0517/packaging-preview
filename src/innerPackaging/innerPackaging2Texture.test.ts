import { describe, expect, it, vi } from 'vitest'
import { BufferGeometry, Float32BufferAttribute } from 'three'

import type { ArtworkTransform } from '../app/types'
import {
  calculateInnerPackaging2DrawSize,
  drawInnerPackaging2Atlas,
  extractInnerPackaging2UvRegions,
} from './innerPackaging2Texture'

const transform: ArtworkTransform = {
  scale: 100,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  stretchX: 100,
  stretchY: 100,
}

describe('inner packaging 2 texture atlas', () => {
  it('extracts front and back UV bounds from triangle normals', () => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute([
      -1, -1, 1, 1, -1, 1, 0, 1, 1,
      -1, -1, -1, 0, 1, -1, 1, -1, -1,
    ], 3))
    geometry.setAttribute('normal', new Float32BufferAttribute([
      0, 0, 1, 0, 0, 1, 0, 0, 1,
      0, 0, -1, 0, 0, -1, 0, 0, -1,
    ], 3))
    geometry.setAttribute('uv', new Float32BufferAttribute([
      0.08, 0.1, 0.44, 0.1, 0.26, 0.9,
      0.56, 0.12, 0.75, 0.88, 0.94, 0.12,
    ], 2))
    geometry.setIndex([0, 1, 2, 3, 4, 5])

    const regions = extractInnerPackaging2UvRegions(geometry)

    expect(regions.front.minU).toBeCloseTo(0.08)
    expect(regions.front.maxU).toBeCloseTo(0.44)
    expect(regions.front.minV).toBeCloseTo(0.1)
    expect(regions.front.maxV).toBeCloseTo(0.9)
    expect(regions.back.minU).toBeCloseTo(0.56)
    expect(regions.back.maxU).toBeCloseTo(0.94)
    expect(regions.back.minV).toBeCloseTo(0.12)
    expect(regions.back.maxV).toBeCloseTo(0.88)
  })

  it('rejects geometry without positions or an index', () => {
    const noPosition = new BufferGeometry()
    noPosition.setAttribute('normal', new Float32BufferAttribute([0, 0, 1], 3))
    noPosition.setAttribute('uv', new Float32BufferAttribute([0.1, 0.1], 2))
    expect(() => extractInnerPackaging2UvRegions(noPosition)).toThrow(
      'Inner packaging 2 model contains no positions',
    )

    const noIndex = new BufferGeometry()
    noIndex.setAttribute('position', new Float32BufferAttribute([
      -1, -1, 1, 1, -1, 1, 0, 1, 1,
    ], 3))
    noIndex.setAttribute('normal', new Float32BufferAttribute([
      0, 0, 1, 0, 0, 1, 0, 0, 1,
    ], 3))
    noIndex.setAttribute('uv', new Float32BufferAttribute([
      0.08, 0.1, 0.44, 0.1, 0.26, 0.9,
    ], 2))
    expect(() => extractInnerPackaging2UvRegions(noIndex)).toThrow(
      'Inner packaging 2 model contains no index',
    )
  })

  it('aspect-fills the UV region without deformation', () => {
    expect(calculateInnerPackaging2DrawSize(1200, 600, 512, 1024, 100)).toEqual({
      width: 2048,
      height: 1024,
    })
    expect(calculateInnerPackaging2DrawSize(600, 1200, 512, 1024, 150)).toEqual({
      width: 768,
      height: 1536,
    })
  })

  it('clips front and back drawings into separate atlas halves', () => {
    const context = {
      fillStyle: '',
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const image = { width: 512, height: 1024 } as HTMLImageElement

    drawInnerPackaging2Atlas(context, 1024, {
      front: { image, transform },
      back: { image, transform: { ...transform, offsetX: 25 } },
    }, {
      front: { minU: 0.1, maxU: 0.4, minV: 0.2, maxV: 0.8 },
      back: { minU: 0.6, maxU: 0.9, minV: 0.25, maxV: 0.75 },
    })

    expect(vi.mocked(context.rect).mock.calls[0]).toEqual(expect.arrayContaining([
      expect.closeTo(102.4), expect.closeTo(204.8), expect.closeTo(307.2), expect.closeTo(614.4),
    ]))
    expect(vi.mocked(context.rect).mock.calls[1]).toEqual(expect.arrayContaining([
      expect.closeTo(614.4), expect.closeTo(256), expect.closeTo(307.2), expect.closeTo(512),
    ]))
    expect(vi.mocked(context.translate).mock.calls[0]).toEqual([
      expect.closeTo(256), expect.closeTo(512),
    ])
    expect(vi.mocked(context.translate).mock.calls[1]).toEqual([
      expect.closeTo(844.8), expect.closeTo(512),
    ])
    expect(context.rotate).toHaveBeenNthCalledWith(1, Math.PI)
    expect(context.rotate).toHaveBeenNthCalledWith(2, Math.PI)
    expect(context.drawImage).toHaveBeenCalledTimes(2)
  })

  it('applies independent horizontal and vertical stretch after fitting', () => {
    const context = {
      fillStyle: '', fillRect: vi.fn(), save: vi.fn(), restore: vi.fn(),
      beginPath: vi.fn(), rect: vi.fn(), clip: vi.fn(), translate: vi.fn(),
      rotate: vi.fn(), drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const image = { width: 600, height: 1200 } as HTMLImageElement

    drawInnerPackaging2Atlas(context, 1000, {
      front: { image, transform: { ...transform, stretchX: 150, stretchY: 75 } },
    }, {
      front: { minU: 0, maxU: 0.5, minV: 0, maxV: 1 },
      back: { minU: 0.5, maxU: 1, minV: 0, maxV: 1 },
    })

    const drawCall = vi.mocked(context.drawImage).mock.calls[0]
    expect(drawCall[0]).toBe(image)
    expect(drawCall.slice(1)).toEqual([
      expect.closeTo(-375), expect.closeTo(-375), expect.closeTo(750), expect.closeTo(750),
    ])
  })
})
