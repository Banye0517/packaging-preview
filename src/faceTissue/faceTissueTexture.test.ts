import { describe, expect, it, vi } from 'vitest'

import {
  calculateFaceTissueArtworkScale,
  FACE_TISSUE_UV_REGIONS,
  drawFaceTissueAtlas,
} from './faceTissueTexture'

describe('face tissue artwork compensation', () => {
  it('uses one conservative scale for the complete artwork', () => {
    expect(calculateFaceTissueArtworkScale({
      width: 200, height: 205, thickness: 100,
    }, {
      width: 160, height: 205, thickness: 80,
    })).toBe(0.8)

    expect(calculateFaceTissueArtworkScale({
      width: 200, height: 205, thickness: 100,
    }, {
      width: 160, height: 205, thickness: 80,
    })).toBe(0.8)
  })

  it('defines four bounded body UV panels without side regions', () => {
    expect(FACE_TISSUE_UV_REGIONS).toHaveLength(4)
    FACE_TISSUE_UV_REGIONS.forEach((region) => {
      expect(region.minU).toBeGreaterThanOrEqual(0)
      expect(region.maxU).toBeLessThanOrEqual(1)
      expect(region.minV).toBeGreaterThanOrEqual(0)
      expect(region.maxV).toBeLessThanOrEqual(1)
    })
  })

  it('matches UV strip panels to their physical surfaces after the model root rotation', () => {
    expect(FACE_TISSUE_UV_REGIONS.map((region) => region.face)).toEqual([
      'front',
      'top',
      'back',
      'bottom',
    ])
  })

  it('maps one long artwork across the continuous front-top-back-bottom UV strip', () => {
    const context = {
      fillStyle: '',
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const image = { width: 606, height: 1186 } as HTMLImageElement
    const size = 2048
    const bounds = {
      minU: Math.min(...FACE_TISSUE_UV_REGIONS.map((region) => region.minU)),
      maxU: Math.max(...FACE_TISSUE_UV_REGIONS.map((region) => region.maxU)),
      minV: Math.min(...FACE_TISSUE_UV_REGIONS.map((region) => region.minV)),
      maxV: Math.max(...FACE_TISSUE_UV_REGIONS.map((region) => region.maxV)),
    }

    drawFaceTissueAtlas(context, size, image, {
      scale: 100,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      stretchX: 100,
      stretchY: 100,
    }, { width: 160, height: 205, thickness: 80 }, { width: 160, height: 205, thickness: 80 })

    expect(context.rect).toHaveBeenCalledTimes(1)
    expect(context.rect).toHaveBeenCalledWith(
      bounds.minU * size,
      bounds.minV * size,
      (bounds.maxU - bounds.minU) * size,
      (bounds.maxV - bounds.minV) * size,
    )
    expect(context.drawImage).toHaveBeenCalledTimes(1)
    const drawCall = vi.mocked(context.drawImage).mock.calls[0]
    expect(drawCall[0]).toBe(image)
    expect(drawCall[1]).toBe(0)
    expect(drawCall[2]).toBe(0)
    expect(Number(drawCall[3]) / Number(drawCall[4])).toBeCloseTo(image.width / image.height)
  })

  it('keeps one artwork continuous when the box grows instead of scaling panels separately', () => {
    const context = {
      fillStyle: '',
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const image = { width: 606, height: 1186 } as HTMLImageElement

    drawFaceTissueAtlas(context, 2048, image, {
      scale: 100,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      stretchX: 100,
      stretchY: 100,
    }, { width: 160, height: 410, thickness: 80 }, { width: 160, height: 205, thickness: 80 })

    expect(context.drawImage).toHaveBeenCalledTimes(1)
    expect(context.scale).toHaveBeenCalledWith(0.5, 0.5)
  })

  it('wraps the artwork when vertical position moves it past the UV edge', () => {
    const context = {
      fillStyle: '',
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const image = { width: 606, height: 1186 } as HTMLImageElement

    drawFaceTissueAtlas(context, 2048, image, {
      scale: 100,
      offsetX: 0,
      offsetY: 90,
      rotation: 0,
      stretchX: 100,
      stretchY: 100,
    }, { width: 160, height: 205, thickness: 80 }, { width: 160, height: 205, thickness: 80 })

    expect(vi.mocked(context.drawImage).mock.calls.length).toBe(2)
  })

  it('anchors horizontal and vertical stretch at the artwork head', () => {
    const createContext = () => ({
      fillStyle: '',
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    const image = { width: 606, height: 1186 } as HTMLImageElement
    const dimensions = { width: 160, height: 205, thickness: 80 }
    const transform = {
      scale: 100,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      stretchX: 100,
      stretchY: 100,
    }
    const stretchedTransform = { ...transform, stretchX: 160, stretchY: 130 }
    const baseContext = createContext()
    const stretchedContext = createContext()

    drawFaceTissueAtlas(baseContext, 2048, image, transform, dimensions, dimensions)
    drawFaceTissueAtlas(stretchedContext, 2048, image, stretchedTransform, dimensions, dimensions)

    const atlasX = Math.min(...FACE_TISSUE_UV_REGIONS.map((region) => region.minU)) * 2048
    const atlasY = Math.min(...FACE_TISSUE_UV_REGIONS.map((region) => region.minV)) * 2048
    expect(vi.mocked(baseContext.translate).mock.calls[0]).toEqual([atlasX, atlasY])
    expect(vi.mocked(stretchedContext.translate).mock.calls[0]).toEqual([atlasX, atlasY])
    expect(stretchedContext.scale).toHaveBeenCalledWith(1.6, 1.3)
    expect(stretchedContext.drawImage).toHaveBeenCalledWith(
      image,
      0,
      0,
      expect.any(Number),
      expect.any(Number),
    )
  })

  it('keeps stretched artwork as one image when its position is at the loop edge', () => {
    const context = {
      fillStyle: '',
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const image = { width: 606, height: 1186 } as HTMLImageElement

    drawFaceTissueAtlas(context, 2048, image, {
      scale: 100,
      offsetX: 0,
      offsetY: -100,
      rotation: 0,
      stretchX: 100,
      stretchY: 130,
    }, { width: 160, height: 205, thickness: 80 }, { width: 160, height: 205, thickness: 80 })

    expect(vi.mocked(context.drawImage).mock.calls.length).toBe(1)
  })

  it('continues the artwork when a slightly stretched image crosses the loop edge', () => {
    const context = {
      fillStyle: '',
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const image = { width: 606, height: 1186 } as HTMLImageElement

    drawFaceTissueAtlas(context, 2048, image, {
      scale: 100,
      offsetX: 0,
      offsetY: -28,
      rotation: 0,
      stretchX: 100,
      stretchY: 107,
    }, { width: 160, height: 205, thickness: 80 }, { width: 160, height: 205, thickness: 80 })

    expect(vi.mocked(context.drawImage).mock.calls.length).toBe(2)
  })
})
