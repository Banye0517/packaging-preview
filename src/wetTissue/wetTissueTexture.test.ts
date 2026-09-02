import { describe, expect, it, vi } from 'vitest'

import type { ArtworkTransform } from '../app/types'
import { drawWetTissueAtlas } from './wetTissueTexture'

const transform: ArtworkTransform = {
  scale: 100, offsetX: 0, offsetY: 0, rotation: 0, stretchX: 100, stretchY: 100,
}

describe('wet tissue texture atlas', () => {
  it('draws a complete supplied UV image with dimension compensation and transforms', () => {
    const context = {
      clearRect: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(),
      scale: vi.fn(), rotate: vi.fn(), drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const image = { width: 1024, height: 1024 } as HTMLImageElement

    drawWetTissueAtlas(context, 2048, image, { ...transform, offsetX: 20, rotation: 30 }, {
      width: 320, height: 410, thickness: 40,
    }, {
      width: 160, height: 205, thickness: 80,
    }, 'body')

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 2048, 2048)
    expect(context.scale).toHaveBeenCalledWith(0.5, 0.5)
    expect(context.rotate).toHaveBeenCalledWith(30 * Math.PI / 180)
    expect(context.drawImage).toHaveBeenCalledWith(image, -1024, -1024, 2048, 2048)
  })

  it('uses width and thickness for the lid UV', () => {
    const context = {
      clearRect: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(),
      scale: vi.fn(), rotate: vi.fn(), drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const image = { width: 512, height: 512 } as HTMLImageElement

    drawWetTissueAtlas(context, 1024, image, transform, {
      width: 320, height: 410, thickness: 40,
    }, {
      width: 160, height: 205, thickness: 80,
    }, 'lid')

    expect(context.scale).toHaveBeenCalledWith(0.5, 2)
  })
})
